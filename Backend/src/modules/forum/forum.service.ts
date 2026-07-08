import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ReportStatus, XpSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { GamificationService } from '../gamification/gamification.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class ForumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly gamificationService: GamificationService,
    private readonly searchService: SearchService,
  ) {}

  async listThreads(params: {
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 10));
    const where = params.category
      ? { category: params.category, isHidden: false }
      : { isHidden: false };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.forumThread.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              replies: true,
              upvoteRecords: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.forumThread.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getThread(threadId: string, page = 1, limit = 20) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.isHidden) {
      throw new NotFoundException('Thread not found');
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));

    const [replies, totalReplies] = await this.prisma.$transaction([
      this.prisma.forumReply.findMany({
        where: { threadId, isHidden: false },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.forumReply.count({ where: { threadId } }),
    ]);

    return {
      thread,
      replies,
      totalReplies,
      page: safePage,
      limit: safeLimit,
    };
  }

  async createThread(authorId: string, dto: CreateThreadDto) {
    const thread = await this.prisma.forumThread.create({
      data: {
        authorId,
        category: dto.category,
        title: dto.title,
        body: dto.body,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.gamificationService.awardXp({
      userId: authorId,
      source: XpSource.FORUM_THREAD,
      points: 10,
      meta: {
        category: dto.category,
        threadTitle: dto.title,
      },
    });
    await this.searchService.syncThread(thread.id);

    return thread;
  }

  async replyToThread(
    threadId: string,
    authorId: string,
    dto: CreateReplyDto,
  ) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: true,
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.isLocked) {
      throw new ConflictException('This thread is locked');
    }

    const reply = await this.prisma.forumReply.create({
      data: {
        threadId,
        authorId,
        body: dto.body,
        audioUrl: dto.audioUrl ?? null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.prisma.forumThread.update({
      where: { id: threadId },
      data: {
        replyCount: {
          increment: 1,
        },
      },
    });
    await this.searchService.syncThread(threadId);

    if (thread.authorId !== authorId) {
      await this.notificationsService.createNotification({
        userId: thread.authorId,
        type: NotificationType.FORUM,
        title: 'New forum reply',
        body: `Someone replied to your thread "${thread.title}".`,
        link: `/forum/${threadId}`,
      });
    }

    await this.gamificationService.awardXp({
      userId: authorId,
      source: XpSource.FORUM_REPLY,
      points: 5,
      meta: {
        threadId,
      },
    });

    return reply;
  }

  async toggleUpvote(threadId: string, userId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const existing = await this.prisma.forumThreadUpvote.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.forumThreadUpvote.delete({
          where: {
            threadId_userId: {
              threadId,
              userId,
            },
          },
        }),
        this.prisma.forumThread.update({
          where: { id: threadId },
          data: {
            upvotes: {
              decrement: 1,
            },
          },
        }),
      ]);

      await this.searchService.syncThread(threadId);

      return { upvoted: false };
    }

    await this.prisma.$transaction([
      this.prisma.forumThreadUpvote.create({
        data: {
          threadId,
          userId,
        },
      }),
      this.prisma.forumThread.update({
        where: { id: threadId },
        data: {
          upvotes: {
            increment: 1,
          },
        },
      }),
    ]);

    if (thread.authorId !== userId) {
      await this.notificationsService.createNotification({
        userId: thread.authorId,
        type: NotificationType.FORUM,
        title: 'New thread upvote',
        body: `Your thread "${thread.title}" got a new upvote.`,
        link: `/forum/${threadId}`,
      });
    }

    await this.gamificationService.awardXp({
      userId,
      source: XpSource.BONUS,
      points: 2,
      meta: {
        threadId,
        action: 'upvote',
      },
    });
    await this.searchService.syncThread(threadId);

    return { upvoted: true };
  }

  async pinThread(threadId: string, pinned: boolean) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const updated = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: pinned },
    });
    await this.searchService.syncThread(threadId);
    return updated;
  }

  async lockThread(threadId: string, locked: boolean) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const updated = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isLocked: locked },
    });
    await this.searchService.syncThread(threadId);
    return updated;
  }

  async hideThread(threadId: string, hidden: boolean, reason?: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const updated = await this.prisma.forumThread.update({
      where: { id: threadId },
      data: {
        isHidden: hidden,
        hiddenAt: hidden ? new Date() : null,
        hiddenReason: hidden ? reason ?? null : null,
      },
    });
    await this.searchService.syncThread(threadId);
    return updated;
  }

  async hideReply(replyId: string, hidden: boolean, reason?: string) {
    const reply = await this.prisma.forumReply.findUnique({
      where: { id: replyId },
    });
    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    return this.prisma.forumReply.update({
      where: { id: replyId },
      data: {
        isHidden: hidden,
        hiddenAt: hidden ? new Date() : null,
        hiddenReason: hidden ? reason ?? null : null,
      },
    });
  }

  async reportContent(data: {
    reporterId: string;
    targetType: 'FORUM_THREAD' | 'FORUM_REPLY' | 'COURSE' | 'USER' | 'SESSION';
    targetId: string;
    reason: string;
    details?: string;
  }) {
    const existing = await this.prisma.contentReport.findFirst({
      where: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWED] },
      },
    });

    if (existing) {
      throw new ConflictException('You already reported this content');
    }

    return this.prisma.contentReport.create({
      data: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        details: data.details ?? null,
      },
    });
  }
}
