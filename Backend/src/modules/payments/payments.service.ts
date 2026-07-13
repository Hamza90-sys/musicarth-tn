import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { SessionsService } from '../sessions/sessions.service';
import { FlouciService } from './flouci.service';

/** Resolve a "YYYY-MM" string to a [start, end) date range. */
function monthRange(month: string): { start: Date; end: Date; key: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(month ?? '');
  const now = new Date();
  const y = match ? Number(match[1]) : now.getFullYear();
  const m = match ? Number(match[2]) : now.getMonth() + 1;
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 1),
    key: `${y}-${String(m).padStart(2, '0')}`,
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flouci: FlouciService,
    private readonly enrollments: EnrollmentsService,
    private readonly sessions: SessionsService,
    private readonly config: ConfigService,
  ) {}

  private studentAppUrl() {
    return this.config.get<string>('STUDENT_APP_URL', 'http://localhost:5174').replace(/\/$/, '');
  }

  private webhookUrl(): string | undefined {
    const publicApi = this.config.get<string>('PUBLIC_API_URL', '').replace(/\/$/, '');
    return publicApi ? `${publicApi}/payments/flouci/webhook` : undefined;
  }

  /** Validates a coupon for a course; returns the discounted amount in millimes. */
  private async applyCoupon(
    code: string,
    course: { id: string; instructorId: string | null },
    amountMillimes: number,
  ) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!coupon || !coupon.active) {
      throw new BadRequestException('This coupon code is not valid');
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.maxUses != null && coupon.uses >= coupon.maxUses) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }
    // A coupon applies to its specific course, or (if course-less) to any course
    // by the instructor who created it.
    const applies = coupon.courseId
      ? coupon.courseId === course.id
      : coupon.createdById === course.instructorId;
    if (!applies) {
      throw new BadRequestException('This coupon does not apply to this course');
    }
    const percent = Math.min(100, Math.max(1, coupon.percentOff));
    const discounted = Math.max(0, Math.round((amountMillimes * (100 - percent)) / 100));
    return { coupon, discounted };
  }

  /** Starts a Flouci checkout for a paid course and returns the redirect link. */
  async createCoursePayment(userId: string, courseId: string, couponCode?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, price: true, isPublished: true, title: true, instructorId: true },
    });
    if (!course || !course.isPublished) {
      throw new NotFoundException('Course not available');
    }
    if (course.price == null || course.price <= 0) {
      throw new BadRequestException('This course is free — just enroll, no payment needed');
    }

    const alreadyEnrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });
    if (alreadyEnrolled) {
      throw new ConflictException('You are already enrolled in this course');
    }

    // Course price is in Tunisian Dinars; Flouci works in millimes (1 TND = 1000).
    let amountMillimes = Math.round(course.price * 1000);
    let couponId: string | null = null;
    if (couponCode?.trim()) {
      const { coupon, discounted } = await this.applyCoupon(couponCode, course, amountMillimes);
      amountMillimes = discounted;
      couponId = coupon.id;
    }

    // A 100%-off coupon skips the gateway entirely.
    if (amountMillimes <= 0 && couponId) {
      const payment = await this.prisma.payment.create({
        data: {
          userId,
          courseId,
          instructorId: course.instructorId,
          couponId,
          amountMillimes: 0,
          status: PaymentStatus.PAID,
        },
      });
      await this.prisma.coupon.update({ where: { id: couponId }, data: { uses: { increment: 1 } } });
      await this.enrollments.enroll(userId, { courseId }).catch(() => undefined);
      return { paymentId: payment.id, link: `${this.studentAppUrl()}/payment/success?pid=${payment.id}` };
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        courseId,
        instructorId: course.instructorId,
        couponId,
        amountMillimes,
        status: PaymentStatus.PENDING,
      },
    });

    const { paymentId, link } = await this.flouci.generatePayment({
      amountMillimes,
      successLink: `${this.studentAppUrl()}/payment/success?pid=${payment.id}`,
      failLink: `${this.studentAppUrl()}/payment/failed?pid=${payment.id}`,
      trackingId: payment.id,
      webhook: this.webhookUrl(),
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: paymentId },
    });

    return { paymentId: payment.id, link };
  }

  /** Starts a Flouci checkout for a paid availability slot (live session booking). */
  async createSessionPayment(userId: string, availabilityId: string) {
    const slot = await this.prisma.sessionAvailability.findUnique({
      where: { id: availabilityId },
      select: { id: true, price: true, isBooked: true, title: true, instructorId: true },
    });
    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }
    if (slot.isBooked) {
      throw new ConflictException('This slot has already been booked');
    }
    if (slot.price <= 0) {
      throw new BadRequestException('This slot is free — book it directly');
    }

    const amountMillimes = Math.round(slot.price * 1000);
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        availabilityId,
        instructorId: slot.instructorId,
        amountMillimes,
        status: PaymentStatus.PENDING,
      },
    });

    const { paymentId, link } = await this.flouci.generatePayment({
      amountMillimes,
      successLink: `${this.studentAppUrl()}/payment/success?pid=${payment.id}`,
      failLink: `${this.studentAppUrl()}/payment/failed?pid=${payment.id}`,
      trackingId: payment.id,
      webhook: this.webhookUrl(),
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: paymentId },
    });

    return { paymentId: payment.id, link };
  }

  /**
   * Verifies a payment with Flouci and, on success, grants what was bought
   * (course enrollment or session booking). Idempotent — safe to call from
   * both the return page and the webhook.
   */
  async verifyAndGrant(paymentId: string, userId?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (userId && payment.userId !== userId) {
      throw new ForbiddenException('This payment does not belong to you');
    }
    if (payment.status === PaymentStatus.PAID) {
      return { status: PaymentStatus.PAID, enrolled: true };
    }
    if (!payment.providerPaymentId) {
      throw new BadRequestException('Payment was not started with the provider');
    }

    const result = await this.flouci.verifyPayment(payment.providerPaymentId);

    if (result.success && result.status === 'SUCCESS') {
      // Revenue split: courses keep PLATFORM_FEE_PERCENT (30%), live sessions
      // keep SESSION_FEE_PERCENT (20%). The instructor earns the rest — and for
      // a group session each student's payment is cut individually.
      const feePercent = payment.availabilityId
        ? Number(this.config.get<string>('SESSION_FEE_PERCENT', '20'))
        : Number(this.config.get<string>('PLATFORM_FEE_PERCENT', '30'));
      const platformFeeMillimes = Math.round((payment.amountMillimes * feePercent) / 100);
      const instructorNetMillimes = payment.amountMillimes - platformFeeMillimes;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, platformFeeMillimes, instructorNetMillimes },
      });
      if (payment.couponId) {
        await this.prisma.coupon
          .update({ where: { id: payment.couponId }, data: { uses: { increment: 1 } } })
          .catch(() => undefined);
      }

      if (payment.courseId) {
        try {
          await this.enrollments.enroll(payment.userId, { courseId: payment.courseId });
        } catch (error) {
          if (!(error instanceof ConflictException)) {
            this.logger.error(`Enrollment after payment ${payment.id} failed: ${String(error)}`);
          }
        }
      } else if (payment.availabilityId) {
        try {
          await this.sessions.bookSession(payment.userId, { availabilityId: payment.availabilityId });
        } catch (error) {
          if (!(error instanceof ConflictException)) {
            this.logger.error(`Booking after payment ${payment.id} failed: ${String(error)}`);
          }
        }
      }
      return { status: PaymentStatus.PAID, enrolled: true };
    }

    const nextStatus =
      result.status === 'EXPIRED'
        ? PaymentStatus.EXPIRED
        : result.status === 'PENDING' || result.status === 'PREAUTH_SUCCESS'
          ? PaymentStatus.PENDING
          : PaymentStatus.FAILED;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: nextStatus },
    });
    return { status: nextStatus, enrolled: false };
  }

  /** Admin: full refund via Flouci, revoke access, mark REFUNDED. */
  async refundPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only PAID payments can be refunded');
    }
    if (!payment.providerPaymentId) {
      // 100%-coupon "payments" have no provider id — just revoke.
      await this.revokeAccess(payment.userId, payment.courseId);
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
      return { status: PaymentStatus.REFUNDED };
    }

    const result = await this.flouci.refundPayment(payment.providerPaymentId);
    if (!result.ok) {
      throw new BadRequestException(result.message ?? 'The provider rejected the refund');
    }
    await this.revokeAccess(payment.userId, payment.courseId);
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED, platformFeeMillimes: 0, instructorNetMillimes: 0 },
    });
    return { status: PaymentStatus.REFUNDED };
  }

  private async revokeAccess(userId: string, courseId: string | null) {
    if (!courseId) return;
    await this.prisma.enrollment
      .delete({ where: { userId_courseId: { userId, courseId } } })
      .catch(() => undefined);
  }

  /** Admin: recent payments across the platform (for the refunds screen). */
  async listRecentPayments() {
    return this.prisma.payment.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amountMillimes: true,
        status: true,
        provider: true,
        createdAt: true,
        user: { select: { fullName: true, email: true } },
        course: { select: { title: true } },
        availabilityId: true,
      },
    });
  }

  /** Instructor: create a coupon (for one of their courses, or all of them). */
  async createCoupon(
    creatorId: string,
    role: string,
    dto: { code: string; percentOff: number; courseId?: string; maxUses?: number; expiresAt?: string },
  ) {
    const code = dto.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      throw new BadRequestException('Coupon code must be 3-32 letters/numbers');
    }
    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
        select: { instructorId: true },
      });
      if (!course) throw new NotFoundException('Course not found');
      if (course.instructorId !== creatorId && role !== UserRole.ADMIN) {
        throw new ForbiddenException('You can only create coupons for your own courses');
      }
    }
    try {
      return await this.prisma.coupon.create({
        data: {
          code,
          percentOff: Math.min(100, Math.max(1, dto.percentOff)),
          courseId: dto.courseId ?? null,
          createdById: creatorId,
          maxUses: dto.maxUses ?? null,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        },
      });
    } catch {
      throw new ConflictException('That coupon code already exists');
    }
  }

  async listMyCoupons(creatorId: string) {
    return this.prisma.coupon.findMany({
      where: { createdById: creatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateCoupon(couponId: string, actorId: string, role: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (coupon.createdById !== actorId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not your coupon');
    }
    return this.prisma.coupon.update({ where: { id: couponId }, data: { active: false } });
  }

  /** Earnings for an instructor: their share of every PAID course sale + live session. */
  async getInstructorEarnings(instructorId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PAID, instructorId },
      select: {
        id: true,
        amountMillimes: true,
        instructorNetMillimes: true,
        platformFeeMillimes: true,
        createdAt: true,
        course: { select: { id: true, title: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalNetMillimes = payments.reduce((s, p) => s + p.instructorNetMillimes, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthNetMillimes = payments
      .filter((p) => p.createdAt >= monthStart)
      .reduce((s, p) => s + p.instructorNetMillimes, 0);

    // How much the platform has already transferred out to this instructor.
    const paidOut = await this.prisma.payout.aggregate({
      where: { instructorId },
      _sum: { amountMillimes: true },
    });
    const paidOutMillimes = paidOut._sum.amountMillimes ?? 0;
    const pendingPayoutMillimes = Math.max(0, totalNetMillimes - paidOutMillimes);

    const byCourse = new Map<string, { courseId: string; title: string; sales: number; netMillimes: number }>();
    for (const p of payments) {
      if (!p.course) continue;
      const entry = byCourse.get(p.course.id) ?? {
        courseId: p.course.id,
        title: p.course.title,
        sales: 0,
        netMillimes: 0,
      };
      entry.sales += 1;
      entry.netMillimes += p.instructorNetMillimes;
      byCourse.set(p.course.id, entry);
    }

    return {
      feePercent: Number(this.config.get<string>('PLATFORM_FEE_PERCENT', '30')),
      totalSales: payments.length,
      totalNetMillimes,
      monthNetMillimes,
      paidOutMillimes,
      pendingPayoutMillimes,
      courses: Array.from(byCourse.values()).sort((a, b) => b.netMillimes - a.netMillimes),
      recent: payments.slice(0, 10).map((p) => ({
        id: p.id,
        courseTitle: p.course?.title ?? 'Live session',
        buyer: p.user.fullName,
        netMillimes: p.instructorNetMillimes,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Admin: for a given month, every instructor who earned money — their 70%
   * net for that month, their saved payout details, and whether they've been
   * marked paid. This is the month-end transfer worksheet.
   */
  async getMonthlyPayouts(month: string) {
    const { start, end, key } = monthRange(month);

    // All PAID payments this month attributed to an instructor (courses + sessions).
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: start, lt: end },
        instructorId: { not: null },
      },
      select: { instructorId: true, instructorNetMillimes: true },
    });

    const totals = new Map<string, { earnedMillimes: number; sales: number }>();
    for (const p of payments) {
      if (!p.instructorId) continue;
      const entry = totals.get(p.instructorId) ?? { earnedMillimes: 0, sales: 0 };
      entry.earnedMillimes += p.instructorNetMillimes;
      entry.sales += 1;
      totals.set(p.instructorId, entry);
    }

    const instructors = await this.prisma.user.findMany({
      where: { id: { in: Array.from(totals.keys()) } },
      select: {
        id: true,
        fullName: true,
        email: true,
        payoutMethod: true,
        bankName: true,
        bankRib: true,
        bankAccountHolder: true,
        flouciNumber: true,
      },
    });
    const payouts = await this.prisma.payout.findMany({ where: { month: key } });
    const paidBy = new Map(payouts.map((p) => [p.instructorId, p]));

    return {
      month: key,
      instructors: instructors
        .map((ins) => {
          const t = totals.get(ins.id) ?? { earnedMillimes: 0, sales: 0 };
          return {
            instructor: ins,
            earnedMillimes: t.earnedMillimes,
            sales: t.sales,
            paid: paidBy.has(ins.id),
            paidAt: paidBy.get(ins.id)?.paidAt ?? null,
            hasPayoutDetails: Boolean(
              ins.payoutMethod === 'flouci' ? ins.flouciNumber : ins.bankRib,
            ),
          };
        })
        .sort((a, b) => b.earnedMillimes - a.earnedMillimes),
    };
  }

  /** Admin: record that an instructor was paid for a month (idempotent per month). */
  async markPayoutPaid(instructorId: string, month: string, note?: string) {
    const { start, end, key } = monthRange(month);
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
      select: { id: true },
    });
    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }
    const agg = await this.prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: start, lt: end },
        instructorId,
      },
      _sum: { instructorNetMillimes: true },
    });
    const amountMillimes = agg._sum.instructorNetMillimes ?? 0;
    const payout = await this.prisma.payout.upsert({
      where: { instructorId_month: { instructorId, month: key } },
      update: { amountMillimes, note: note ?? null, paidAt: new Date() },
      create: { instructorId, month: key, amountMillimes, note: note ?? null },
    });
    return payout;
  }

  /** Webhook entry point — Flouci posts the payment id; we re-verify server-side. */
  async handleWebhook(body: unknown) {
    const data = (body ?? {}) as Record<string, unknown>;
    const trackingId =
      (data.developer_tracking_id as string) ??
      (data.developerTrackingId as string) ??
      ((data.result as Record<string, unknown>)?.developer_tracking_id as string);
    if (!trackingId) {
      this.logger.warn(`Flouci webhook without a tracking id: ${JSON.stringify(data)}`);
      return { received: true };
    }
    await this.verifyAndGrant(trackingId).catch((error) =>
      this.logger.error(`Webhook grant failed for ${trackingId}: ${String(error)}`),
    );
    return { received: true };
  }
}
