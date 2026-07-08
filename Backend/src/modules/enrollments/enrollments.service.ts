import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollCourseDto } from './dto/enroll-course.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async enroll(userId: string, dto: EnrollCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { id: true, isPublished: true, price: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (!course.isPublished) {
      throw new ForbiddenException('Course is not published yet');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: dto.courseId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('You are already enrolled in this course');
    }

    // Paid courses require a completed payment before enrolling.
    if (course.price != null && course.price > 0) {
      const paid = await this.prisma.payment.findFirst({
        where: { userId, courseId: dto.courseId, status: PaymentStatus.PAID },
        select: { id: true },
      });
      if (!paid) {
        throw new ForbiddenException('This is a paid course — complete payment to enroll');
      }
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId: dto.courseId,
      },
    });

    await this.redisService.del(`enrollments:${userId}`);
    return enrollment;
  }

  async listMyEnrollments(userId: string) {
    const cacheKey = `enrollments:${userId}`;
    const cached = await this.redisService.getJson<unknown[]>(cacheKey);
    if (cached) {
      return { source: 'cache', data: cached };
    }

    const data = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            isPublished: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.setJson(cacheKey, data, { ttlSeconds: 120 });
    return { source: 'db', data };
  }

  async updateProgress(
    userId: string,
    courseId: string,
    dto: UpdateProgressDto,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const status =
      dto.progress >= 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE;

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: dto.progress,
        status,
        completedAt: status === EnrollmentStatus.COMPLETED ? new Date() : null,
      },
    });

    await this.redisService.del(`enrollments:${userId}`);
    return updated;
  }
}
