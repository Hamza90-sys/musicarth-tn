import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ContentReport,
  CourseApprovalStatus,
  LiveSessionStatus,
  Prisma,
  NotificationType,
  ReportStatus,
  ReportTargetType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly searchService: SearchService,
  ) {}

  async getAnalytics() {
    const [users, instructors, courses, publishedCourses, sessions, reports, badges] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { role: UserRole.INSTRUCTOR, deletedAt: null } }),
        this.prisma.course.count(),
        this.prisma.course.count({ where: { isPublished: true } }),
        this.prisma.liveSession.count(),
        this.prisma.contentReport.count(),
        this.prisma.badge.count(),
      ]);

    return {
      users,
      instructors,
      courses,
      publishedCourses,
      sessions,
      reports,
      badges,
    };
  }

  async listSessions(params: {
    status?: LiveSessionStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const where = params.status ? { status: params.status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.liveSession.findMany({
        where,
        include: {
          instructor: { select: { id: true, fullName: true, email: true } },
          student: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.liveSession.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async listUsers(params: { q?: string; role?: UserRole; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const where = {
      deletedAt: null,
      ...(params.role ? { role: params.role } : {}),
      ...(params.q
        ? {
            OR: [
              { fullName: { contains: params.q, mode: 'insensitive' as const } },
              { email: { contains: params.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          languagePreference: true,
          avatarUrl: true,
          bio: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateUserRole(userId: string, role: UserRole, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Account updated by admin',
      body: `Your account role was updated to ${role.toLowerCase()}.`,
      link: '/profile',
    });

    await this.prisma.adminAction.create({
      data: {
        actorId,
        action: 'USER_ROLE_UPDATE',
        entityType: 'User',
        entityId: userId,
        payload: { role },
      },
    });

    return updated;
  }

  async updateCourseApproval(
    courseId: string,
    status: CourseApprovalStatus,
    actorId: string,
    notes?: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updated =
      status === CourseApprovalStatus.APPROVED
        ? await this.prisma.course.update({
            where: { id: courseId },
            data: {
              approvalStatus: CourseApprovalStatus.APPROVED,
              approvedAt: new Date(),
              publishedAt: course.publishedAt ?? new Date(),
              approvedById: actorId,
              isPublished: true,
            },
          })
        : await this.prisma.course.update({
            where: { id: courseId },
            data: {
              approvalStatus: status,
              approvedAt: null,
              approvedById: null,
              isPublished: false,
            },
          });

    await this.prisma.adminAction.create({
      data: {
        actorId,
        action: 'COURSE_APPROVAL_UPDATE',
        entityType: 'Course',
        entityId: courseId,
        payload: { status, notes: notes ?? null },
      },
    });

    await this.notificationsService.createNotification({
      userId: course.instructorId ?? actorId,
      type: NotificationType.SYSTEM,
      title: 'Course approval updated',
      body: `Your course "${course.title}" is now ${status.toLowerCase()}.`,
      link: `/courses/${courseId}`,
    });

    await this.searchService.syncCourse(courseId);
    return updated;
  }

  async listReports(params: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));

    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.targetType ? { targetType: params.targetType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contentReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contentReport.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async resolveReport(
    reportId: string,
    actorId: string,
    resolution: {
      status: ReportStatus;
      resolutionNotes?: string;
    },
  ) {
    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        status: resolution.status,
        resolutionNotes: resolution.resolutionNotes ?? null,
        resolvedAt: new Date(),
        resolvedById: actorId,
      },
    });

    if (resolution.status === ReportStatus.RESOLVED) {
      if (report.targetType === ReportTargetType.FORUM_THREAD) {
        await this.prisma.forumThread.update({
          where: { id: report.targetId },
          data: {
            isHidden: true,
            hiddenAt: new Date(),
            hiddenReason: resolution.resolutionNotes ?? 'Hidden by admin resolution',
            hiddenById: actorId,
          },
        });
      }

      if (report.targetType === ReportTargetType.FORUM_REPLY) {
        await this.prisma.forumReply.update({
          where: { id: report.targetId },
          data: {
            isHidden: true,
            hiddenAt: new Date(),
            hiddenReason: resolution.resolutionNotes ?? 'Hidden by admin resolution',
            hiddenById: actorId,
          },
        });
      }

      if (report.targetType === ReportTargetType.COURSE) {
        await this.prisma.course.update({
          where: { id: report.targetId },
          data: {
            approvalStatus: CourseApprovalStatus.REJECTED,
            isPublished: false,
          },
        });
        await this.searchService.syncCourse(report.targetId);
      }
    }

    await this.prisma.adminAction.create({
      data: {
        actorId,
        action: 'REPORT_RESOLUTION',
        entityType: 'ContentReport',
        entityId: reportId,
        payload: resolution as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  }
}
