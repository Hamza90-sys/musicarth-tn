import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentApplicationDto } from './dto/create-student-application.dto';
import { CreateInstructorApplicationDto } from './dto/create-instructor-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { NotificationsService } from '../notifications/notifications.service';

const INVITE_TTL_DAYS = 7;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createStudentApplication(dto: CreateStudentApplicationDto) {
    await this.assertCanApply(dto.email, UserRole.STUDENT);
    const application = await this.prisma.application.create({
      data: {
        role: UserRole.STUDENT,
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        country: dto.country,
        city: dto.city,
        address: dto.address ?? null,
        instruments: dto.instruments ?? null,
        motivation: dto.motivation ?? null,
      },
    });
    await this.notifyAdmins(
      'New student application',
      `${application.fullName} applied to join as a student.`,
    );
    return application;
  }

  async createInstructorApplication(
    dto: CreateInstructorApplicationDto,
    cv?: Express.Multer.File,
  ) {
    if (!cv) {
      throw new BadRequestException('A CV (PDF) is required for instructor applications');
    }
    await this.assertCanApply(dto.email, UserRole.INSTRUCTOR);
    const application = await this.prisma.application.create({
      data: {
        role: UserRole.INSTRUCTOR,
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        country: dto.country,
        city: dto.city,
        address: dto.address ?? null,
        instruments: dto.instruments,
        motivation: dto.motivation ?? null,
        cvFileName: cv.originalname,
        cvStoragePath: cv.path,
      },
    });
    await this.notifyAdmins(
      'New instructor application',
      `${application.fullName} applied to teach on Musicarth.`,
    );
    return application;
  }

  /** Fan a notification out to every admin (best-effort; never blocks the caller). */
  private async notifyAdmins(title: string, body: string, link = '/applications') {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });
      await Promise.all(
        admins.map((admin) =>
          this.notificationsService.createNotification({
            userId: admin.id,
            title,
            body,
            link,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to notify admins: ${String(error)}`);
    }
  }

  async listApplications(status?: ApplicationStatus) {
    const items = await this.prisma.application.findMany({
      where: status ? { status } : {},
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        reviewedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    // Never leak the storage path to clients; expose only whether a CV exists.
    return items.map(({ cvStoragePath, ...rest }) => ({
      ...rest,
      hasCv: Boolean(cvStoragePath),
    }));
  }

  async getApplicationCv(id: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application || !application.cvStoragePath) {
      throw new NotFoundException('CV not found for this application');
    }
    return { path: application.cvStoragePath, fileName: application.cvFileName ?? 'cv.pdf' };
  }

  async reviewApplication(id: string, dto: ReviewApplicationDto, adminId: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== ApplicationStatus.PENDING) {
      throw new ConflictException('This application has already been reviewed');
    }

    if (dto.decision === 'REJECTED') {
      const rejected = await this.prisma.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.REJECTED,
          reviewNotes: dto.notes ?? null,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
      return { application: rejected, inviteLink: null };
    }

    // APPROVED → create the (password-less) account and an invite to set a password.
    const existing = await this.prisma.user.findUnique({
      where: { email: application.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const { user } = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: application.email,
          fullName: application.fullName,
          role: application.role,
          passwordHash: null,
        },
      });

      await tx.passwordSetupToken.create({
        data: {
          userId: createdUser.id,
          tokenHash,
          expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewNotes: dto.notes ?? null,
          reviewedById: adminId,
          reviewedAt: new Date(),
          createdUserId: createdUser.id,
        },
      });

      return { user: createdUser };
    });

    const inviteLink = this.buildInviteLink(application.role, rawToken);
    await this.sendInviteEmail(application.email, application.fullName, inviteLink, application.role);

    const updated = await this.prisma.application.findUniqueOrThrow({ where: { id } });
    return { application: updated, inviteLink, userId: user.id };
  }

  private async assertCanApply(email: string, role: UserRole) {
    const normalized = email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }
    const pending = await this.prisma.application.findFirst({
      where: { email: normalized, role, status: ApplicationStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException('You already have a pending application under review');
    }
  }

  private buildInviteLink(role: UserRole, rawToken: string) {
    const base =
      role === UserRole.INSTRUCTOR
        ? this.config.get<string>('INSTRUCTOR_APP_URL', 'http://localhost:5175')
        : this.config.get<string>('STUDENT_APP_URL', 'http://localhost:5174');
    return `${base.replace(/\/$/, '')}/set-password?token=${rawToken}`;
  }

  private async sendInviteEmail(
    email: string,
    fullName: string,
    inviteLink: string,
    role: UserRole,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY', '');
    const roleLabel = role === UserRole.INSTRUCTOR ? 'instructor' : 'student';

    if (!apiKey) {
      // Email isn't configured yet — surface the link so the admin can send it.
      this.logger.warn(
        `INVITE (no email provider configured) for ${email} [${roleLabel}]: ${inviteLink}`,
      );
      return;
    }

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.get<string>('MAIL_FROM', 'MUSIQA <onboarding@musiqa.local>'),
          to: email,
          subject: `Your MUSIQA ${roleLabel} application was approved`,
          html: `<p>Hi ${fullName},</p><p>Your application to join MUSIQA as ${roleLabel} has been approved. Set your password to activate your account:</p><p><a href="${inviteLink}">Set your password</a></p><p>This link expires in ${INVITE_TTL_DAYS} days.</p>`,
        }),
      });
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${email}: ${String(error)}`);
    }
  }
}
