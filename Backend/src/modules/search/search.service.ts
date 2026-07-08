import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type SearchType = 'all' | 'courses' | 'instructors' | 'forum';

type SearchParams = {
  q: string;
  type?: SearchType;
  limit?: number;
};

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async search(params: SearchParams) {
    const query = params.q.trim();
    const type = params.type ?? 'all';
    const limit = Math.min(25, Math.max(1, params.limit ?? 10));

    if (!query) {
      return {
        query,
        type,
        courses: type === 'all' || type === 'courses' ? await this.searchCourses('', limit) : [],
        instructors: type === 'all' || type === 'instructors' ? await this.searchInstructors('', limit) : [],
        threads: type === 'all' || type === 'forum' ? await this.searchThreads('', limit) : [],
        meta: {
          meiliConfigured: this.isMeiliConfigured(),
        },
      };
    }

    const [courses, instructors, threads] = await Promise.all([
      type === 'all' || type === 'courses'
        ? this.searchCourses(query, limit)
        : Promise.resolve([]),
      type === 'all' || type === 'instructors'
        ? this.searchInstructors(query, limit)
        : Promise.resolve([]),
      type === 'all' || type === 'forum'
        ? this.searchThreads(query, limit)
        : Promise.resolve([]),
    ]);

    return {
      query,
      type,
      courses,
      instructors,
      threads,
      meta: {
        meiliConfigured: this.isMeiliConfigured(),
      },
    };
  }

  async searchCourses(query: string, limit = 10) {
    const meili = await this.searchMeiliIndex('courses', query, limit);
    if (meili) {
      return meili.filter((item: any) => item?.isPublished !== false);
    }

    const rows = await this.prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { instrument: { contains: query, mode: 'insensitive' } },
          { level: { contains: query, mode: 'insensitive' } },
        ],
        isPublished: true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows;
  }

  async searchInstructors(query: string, limit = 10) {
    const meili = await this.searchMeiliIndex('instructors', query, limit);
    if (meili) {
      return meili.filter((item: any) => item?.isVisible !== false);
    }

    return this.prisma.user.findMany({
      where: {
        role: UserRole.INSTRUCTOR,
        deletedAt: null,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        bio: true,
        languagePreference: true,
      },
      orderBy: { fullName: 'asc' },
      take: limit,
    });
  }

  async searchThreads(query: string, limit = 10) {
    const meili = await this.searchMeiliIndex('forum', query, limit);
    if (meili) {
      return meili.filter((item: any) => item?.isHidden !== true);
    }

    return this.prisma.forumThread.findMany({
      where: {
        isHidden: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
            upvoteRecords: true,
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async syncCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
    if (!course) return;
    await this.upsertMeili('courses', course.id, {
      id: course.id,
      title: course.title,
      description: course.description,
      instrument: course.instrument,
      level: course.level,
      price: course.price,
      isPublished: course.isPublished,
      instructorId: course.instructorId,
      instructorName: course.instructor?.fullName ?? null,
      thumbnailUrl: course.thumbnailUrl,
    });
  }

  async syncThread(threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
    if (!thread) return;
    await this.upsertMeili('forum', thread.id, {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      category: thread.category,
      authorId: thread.authorId,
      authorName: thread.author?.fullName ?? null,
      upvotes: thread.upvotes,
      replyCount: thread.replyCount,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
    });
  }

  async syncUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
        languagePreference: true,
        deletedAt: true,
      },
    });
    if (!user) return;
    await this.upsertMeili('instructors', user.id, {
      ...user,
      isVisible: user.deletedAt == null,
    });
  }

  async rebuildIndexes() {
    await Promise.all([
      this.prisma.course.findMany({
        include: { instructor: { select: { id: true, fullName: true, avatarUrl: true } } },
      }).then((rows) =>
        Promise.all(rows.map((row) => this.upsertMeili('courses', row.id, row))),
      ),
      this.prisma.forumThread.findMany({
        include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      }).then((rows) =>
        Promise.all(rows.map((row) => this.upsertMeili('forum', row.id, row))),
      ),
      this.prisma.user.findMany({
        where: { role: UserRole.INSTRUCTOR, deletedAt: null },
      }).then((rows) =>
        Promise.all(rows.map((row) => this.upsertMeili('instructors', row.id, row))),
      ),
    ]);
    return { message: 'Search indexes rebuilt' };
  }

  private async searchMeiliIndex(indexName: string, query: string, limit: number) {
    if (!this.isMeiliConfigured()) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.getMeiliHost()}/indexes/${indexName}/search`,
        {
          method: 'POST',
          headers: this.getMeiliHeaders(),
          body: JSON.stringify({
            q: query,
            limit,
          }),
        },
      );

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as { hits?: unknown[] };
      return payload.hits ?? [];
    } catch (error) {
      this.logger.warn(
        `Meili search failed for ${indexName}, falling back to Prisma: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return null;
    }
  }

  private async upsertMeili(indexName: string, id: string, document: unknown) {
    if (!this.isMeiliConfigured()) {
      return;
    }

    try {
      await fetch(`${this.getMeiliHost()}/indexes/${indexName}/documents`, {
        method: 'POST',
        headers: this.getMeiliHeaders(),
        body: JSON.stringify([document]),
      });
    } catch (error) {
      this.logger.warn(
        `Meili index sync failed for ${indexName}/${id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private getMeiliHost() {
    return this.configService.get<string>('MEILI_HOST', '').replace(/\/$/, '');
  }

  private getMeiliHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const apiKey = this.configService.get<string>('MEILI_API_KEY', '');
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    return headers;
  }

  private isMeiliConfigured() {
    return Boolean(this.configService.get<string>('MEILI_HOST', ''));
  }
}
