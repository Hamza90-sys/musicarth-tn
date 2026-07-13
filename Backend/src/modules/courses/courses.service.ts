import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CourseApprovalStatus,
  EnrollmentStatus,
  UserRole,
  XpSource,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { GamificationService } from '../gamification/gamification.service';
import { SearchService } from '../search/search.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VideoService } from '../video/video.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly searchService: SearchService,
    private readonly notificationsService: NotificationsService,
    private readonly videoService: VideoService,
  ) {}

  async generateCertificate(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }
    if (enrollment.progress < 100 && enrollment.status !== EnrollmentStatus.COMPLETED) {
      throw new ForbiddenException('Complete the course to earn your certificate');
    }

    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.course.findUnique({
        where: { id: courseId },
        include: { instructor: { select: { fullName: true } } },
      }),
    ]);
    if (!user || !course) {
      throw new NotFoundException('Certificate data not found');
    }

    const buffer = await this.renderCertificatePdf({
      studentName: user.fullName,
      courseTitle: course.title,
      instructorName: course.instructor?.fullName ?? 'Musicarth',
      date: new Date(),
    });
    const safeTitle =
      course.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60) || 'course';
    return { buffer, fileName: `musicarth-certificate-${safeTitle}.pdf` };
  }

  private renderCertificatePdf(data: {
    studentName: string;
    courseTitle: string;
    instructorName: string;
    date: Date;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .lineWidth(3)
        .strokeColor('#7C3AED')
        .rect(28, 28, doc.page.width - 56, doc.page.height - 56)
        .stroke();

      doc.moveDown(2);
      doc.fillColor('#7C3AED').fontSize(14).text('MUSICARTH', { align: 'center' });
      doc.moveDown(0.6);
      doc.fillColor('#111111').fontSize(40).text('Certificate of Completion', { align: 'center' });
      doc.moveDown(1);
      doc.fillColor('#444444').fontSize(16).text('This certifies that', { align: 'center' });
      doc.moveDown(0.4);
      doc.fillColor('#111111').fontSize(30).text(data.studentName, { align: 'center' });
      doc.moveDown(0.4);
      doc.fillColor('#444444').fontSize(16).text('has successfully completed', { align: 'center' });
      doc.moveDown(0.4);
      doc.fillColor('#7C3AED').fontSize(24).text(data.courseTitle, { align: 'center' });
      doc.moveDown(1.6);
      doc.fillColor('#444444').fontSize(13).text(`Instructor: ${data.instructorName}`, { align: 'center' });
      doc.text(`Issued on ${data.date.toLocaleDateString()}`, { align: 'center' });

      doc.end();
    });
  }

  async createCourse(
    dto: CreateCourseDto,
    actor: { sub: string; role: string },
  ) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        description: dto.description,
        titleFr: dto.titleFr ?? null,
        titleAr: dto.titleAr ?? null,
        descriptionFr: dto.descriptionFr ?? null,
        descriptionAr: dto.descriptionAr ?? null,
        whatYouWillLearn: dto.whatYouWillLearn ?? [],
        requirements: dto.requirements ?? [],
        tags: dto.tags ?? [],
        includedLiveSessions: dto.includedLiveSessions ?? 0,
        instrument: dto.instrument,
        level: dto.level,
        price: dto.price ?? null,
        thumbnailUrl: dto.thumbnailUrl ?? null,
        isPublished: dto.isPublished ?? false,
        approvalStatus: CourseApprovalStatus.PENDING,
        instructorId:
          actor.role === UserRole.INSTRUCTOR || actor.role === UserRole.ADMIN
            ? actor.sub
            : null,
      },
    });
    await this.searchService.syncCourse(course.id);
    return course;
  }

  async upsertReview(
    courseId: string,
    userId: string,
    dto: { rating: number; comment?: string },
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('Enroll in this course before reviewing it');
    }
    if (enrollment.progress < 30) {
      throw new ForbiddenException(
        'You can leave a review after completing 30% of the course',
      );
    }

    return this.prisma.courseReview.upsert({
      where: { courseId_userId: { courseId, userId } },
      update: { rating: dto.rating, comment: dto.comment ?? null },
      create: { courseId, userId, rating: dto.rating, comment: dto.comment ?? null },
    });
  }

  async listReviews(courseId: string) {
    const [items, aggregate] = await this.prisma.$transaction([
      this.prisma.courseReview.findMany({
        where: { courseId },
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.courseReview.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      items,
      average: aggregate._avg.rating
        ? Math.round(aggregate._avg.rating * 10) / 10
        : null,
      count: aggregate._count,
    };
  }

  async listCourses(params?: { page?: number; limit?: number }) {
    // Optional pagination (response stays an array for client compatibility);
    // the nested payload is trimmed — lesson content/video URLs are only
    // loaded on the course detail endpoint, never in the list.
    const limit = Math.min(200, Math.max(1, params?.limit ?? 100));
    const page = Math.max(1, params?.page ?? 1);
    return this.prisma.course.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        sections: {
          select: {
            id: true,
            title: true,
            order: true,
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
                durationSeconds: true,
                isFreePreview: true,
                videoStatus: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: {
          select: {
            id: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCourse(
    courseId: string,
    dto: UpdateCourseDto,
    actor: { sub: string; role: string },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.assertCanManageCourse(course.instructorId, actor);

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        title: dto.title,
        subtitle: dto.subtitle === undefined ? undefined : dto.subtitle,
        description: dto.description,
        whatYouWillLearn: dto.whatYouWillLearn,
        requirements: dto.requirements,
        tags: dto.tags,
        includedLiveSessions: dto.includedLiveSessions,
        instrument: dto.instrument,
        level: dto.level,
        price: dto.price === undefined ? undefined : dto.price,
        thumbnailUrl:
          dto.thumbnailUrl === undefined ? undefined : dto.thumbnailUrl,
        isPublished: dto.isPublished,
      },
    });
    await this.searchService.syncCourse(courseId);
    return updated;
  }

  async publishCourse(courseId: string, actor: { sub: string; role: string }) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, isPublished: true, title: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.assertCanManageCourse(course.instructorId, actor);

    if (course.isPublished) {
      return this.prisma.course.findUnique({ where: { id: courseId } });
    }

    // Only an admin may publish directly. An instructor's "publish" submits the
    // course for admin review (spec §13: admin approval required before live).
    const isAdmin = actor.role === UserRole.ADMIN;
    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: isAdmin
        ? {
            isPublished: true,
            approvalStatus: CourseApprovalStatus.APPROVED,
            approvedAt: new Date(),
            publishedAt: new Date(),
            approvedById: actor.sub,
          }
        : {
            isPublished: false,
            approvalStatus: CourseApprovalStatus.PENDING,
          },
    });
    await this.searchService.syncCourse(courseId);
    if (!isAdmin) {
      await this.notifyAdmins(
        'Course submitted for review',
        `"${course.title}" was submitted and is awaiting approval.`,
        '/courses',
      );
    }
    return updated;
  }

  /** Fan a notification out to every admin (best-effort; never blocks the caller). */
  private async notifyAdmins(title: string, body: string, link = '/courses') {
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
    } catch {
      // Notifications are best-effort; never fail the publish on a notify error.
    }
  }

  /**
   * Public: real instructors who have at least one published course, ranked by
   * their average course rating (then by students). Used on the landing page —
   * returns [] when there are no instructors yet, so the section can hide.
   */
  async getFeaturedInstructors(limit = 8) {
    const instructors = await this.prisma.user.findMany({
      where: {
        role: UserRole.INSTRUCTOR,
        deletedAt: null,
        authoredCourses: { some: { isPublished: true } },
      },
      select: {
        id: true,
        fullName: true,
        headline: true,
        avatarUrl: true,
        authoredCourses: {
          where: { isPublished: true },
          select: {
            instrument: true,
            reviews: { select: { rating: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
      take: 50,
    });

    return instructors
      .map((ins) => {
        const ratings = ins.authoredCourses.flatMap((c) => c.reviews.map((r) => r.rating));
        const avg = ratings.length
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;
        const students = ins.authoredCourses.reduce((s, c) => s + c._count.enrollments, 0);
        return {
          id: ins.id,
          fullName: ins.fullName,
          headline: ins.headline,
          avatarUrl: ins.avatarUrl,
          instrument: ins.authoredCourses[0]?.instrument ?? null,
          rating: avg,
          students,
          courseCount: ins.authoredCourses.length,
        };
      })
      .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.students - a.students)
      .slice(0, limit);
  }

  async getCourseById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            headline: true,
            bio: true,
            avatarUrl: true,
          },
        },
        sections: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: {
          select: {
            id: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Total lessons + total duration help the public course page render the
    // "X lessons • Yh Zm" summary without the client recomputing it.
    const totalLessons = course.sections.reduce(
      (sum, section) => sum + section.lessons.length,
      0,
    );
    const totalDurationSeconds = course.sections.reduce(
      (sum, section) =>
        sum +
        section.lessons.reduce(
          (lessonSum, lesson) => lessonSum + (lesson.durationSeconds ?? 0),
          0,
        ),
      0,
    );

    return {
      ...course,
      enrolledCount: course.enrollments.length,
      totalLessons,
      totalDurationSeconds,
    };
  }

  async getCourseProgress(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const lessonIds = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => lesson.id),
    );

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return {
        courseId,
        enrollment: null,
        progress: 0,
        totalLessons: lessonIds.length,
        lessonProgress: [],
      };
    }

    const lessonProgress = await this.prisma.lessonProgress.findMany({
      where: {
        enrollmentId: enrollment.id,
        lessonId: { in: lessonIds },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      courseId,
      enrollment,
      progress: enrollment.progress,
      totalLessons: lessonIds.length,
      lessonProgress,
    };
  }

  async createSection(
    courseId: string,
    dto: CreateSectionDto,
    actor: { sub: string; role: string },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const isAdmin = actor.role === UserRole.ADMIN;
    const isOwner = course.instructorId === actor.sub;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only the course owner can add sections');
    }

    const section = await this.prisma.section.create({
      data: {
        title: dto.title,
        order: dto.order,
        courseId,
      },
    });
    await this.searchService.syncCourse(courseId);
    return section;
  }

  async createLesson(
    sectionId: string,
    dto: CreateLessonDto,
    actor: { sub: string; role: string },
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          select: { instructorId: true },
        },
      },
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const isAdmin = actor.role === UserRole.ADMIN;
    const isOwner = section.course.instructorId === actor.sub;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only the course owner can add lessons');
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        title: dto.title,
        titleFr: dto.titleFr ?? null,
        titleAr: dto.titleAr ?? null,
        content: dto.content,
        contentFr: dto.contentFr ?? null,
        contentAr: dto.contentAr ?? null,
        videoUrl: dto.videoUrl,
        durationSeconds: dto.durationSeconds ?? null,
        isFreePreview: dto.isFreePreview ?? false,
        order: dto.order,
        sectionId,
      },
    });
    await this.searchService.syncCourse(section.courseId);
    return lesson;
  }

  async updateLesson(
    lessonId: string,
    dto: {
      title?: string;
      titleFr?: string;
      titleAr?: string;
      content?: string;
      isFreePreview?: boolean;
    },
    actor: { sub: string; role: string },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: { select: { courseId: true, course: { select: { instructorId: true } } } },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    this.assertCanManageCourse(lesson.section.course.instructorId, actor);

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: dto.title,
        titleFr: dto.titleFr,
        titleAr: dto.titleAr,
        content: dto.content,
        isFreePreview: dto.isFreePreview,
      },
    });
    await this.searchService.syncCourse(lesson.section.courseId);
    return updated;
  }

  async deleteCourse(courseId: string, actor: { sub: string; role: string }) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    this.assertCanManageCourse(course.instructorId, actor);
    // Best-effort: free the Mux assets before the rows cascade away.
    const courseLessons = await this.prisma.lesson.findMany({
      where: { section: { courseId } },
      select: { muxAssetId: true },
    });
    await this.prisma.course.delete({ where: { id: courseId } });
    void this.videoService.deleteAssets(courseLessons.map((l) => l.muxAssetId));
    await this.searchService.syncCourse(courseId).catch(() => undefined);
    return { id: courseId, deleted: true };
  }

  async deleteSection(sectionId: string, actor: { sub: string; role: string }) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { courseId: true, course: { select: { instructorId: true } } },
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    this.assertCanManageCourse(section.course.instructorId, actor);
    const sectionLessons = await this.prisma.lesson.findMany({
      where: { sectionId },
      select: { muxAssetId: true },
    });
    await this.prisma.section.delete({ where: { id: sectionId } });
    void this.videoService.deleteAssets(sectionLessons.map((l) => l.muxAssetId));
    await this.searchService.syncCourse(section.courseId);
    return { id: sectionId, deleted: true };
  }

  async deleteLesson(lessonId: string, actor: { sub: string; role: string }) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        muxAssetId: true,
        section: { select: { courseId: true, course: { select: { instructorId: true } } } },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    this.assertCanManageCourse(lesson.section.course.instructorId, actor);
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    void this.videoService.deleteAssets([lesson.muxAssetId]);
    await this.searchService.syncCourse(lesson.section.courseId);
    return { id: lessonId, deleted: true };
  }

  async reorderSections(
    courseId: string,
    sectionIds: string[],
    actor: { sub: string; role: string },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, sections: { select: { id: true } } },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    this.assertCanManageCourse(course.instructorId, actor);

    const owned = new Set(course.sections.map((s) => s.id));
    if (sectionIds.length !== owned.size || sectionIds.some((id) => !owned.has(id))) {
      throw new BadRequestException('Section list does not match this course');
    }

    // Two-pass to avoid the unique([courseId, order]) collision mid-update.
    await this.prisma.$transaction([
      ...sectionIds.map((id, i) =>
        this.prisma.section.update({ where: { id }, data: { order: 10000 + i } }),
      ),
      ...sectionIds.map((id, i) =>
        this.prisma.section.update({ where: { id }, data: { order: i + 1 } }),
      ),
    ]);
    await this.searchService.syncCourse(courseId);
    return { reordered: true };
  }

  async reorderLessons(
    sectionId: string,
    lessonIds: string[],
    actor: { sub: string; role: string },
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        courseId: true,
        course: { select: { instructorId: true } },
        lessons: { select: { id: true } },
      },
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    this.assertCanManageCourse(section.course.instructorId, actor);

    const owned = new Set(section.lessons.map((l) => l.id));
    if (lessonIds.length !== owned.size || lessonIds.some((id) => !owned.has(id))) {
      throw new BadRequestException('Lesson list does not match this section');
    }

    await this.prisma.$transaction([
      ...lessonIds.map((id, i) =>
        this.prisma.lesson.update({ where: { id }, data: { order: 10000 + i } }),
      ),
      ...lessonIds.map((id, i) =>
        this.prisma.lesson.update({ where: { id }, data: { order: i + 1 } }),
      ),
    ]);
    await this.searchService.syncCourse(section.courseId);
    return { reordered: true };
  }

  async updateLessonProgress(
    lessonId: string,
    userId: string,
    dto: UpdateLessonProgressDto,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.section.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
    });

    const completed = dto.completed ?? false;
    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        watchPositionSeconds: dto.watchPositionSeconds,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        watchPositionSeconds: dto.watchPositionSeconds,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    if (completed && !existingProgress?.completed) {
      await this.gamificationService.awardXp({
        userId,
        source: XpSource.LESSON_COMPLETION,
        points: 50,
        instrument: lesson.section.course.instrument,
        meta: {
          courseId: lesson.section.courseId,
          lessonId,
        },
      });
    }

    const totalLessons = await this.prisma.lesson.count({
      where: {
        section: {
          courseId: lesson.section.courseId,
        },
      },
    });

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        enrollmentId: enrollment.id,
        completed: true,
      },
    });

    const progress =
      totalLessons === 0
        ? 0
        : Math.min(100, Math.round((completedLessons / totalLessons) * 100));

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress,
        status:
          progress >= 100
            ? EnrollmentStatus.COMPLETED
            : EnrollmentStatus.ACTIVE,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });

    return lessonProgress;
  }

  private assertCanManageCourse(
    instructorId: string | null,
    actor: { sub: string; role: string },
  ) {
    const isAdmin = actor.role === UserRole.ADMIN;
    const isOwner = instructorId === actor.sub;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only the course owner can manage this course');
    }
  }
}
