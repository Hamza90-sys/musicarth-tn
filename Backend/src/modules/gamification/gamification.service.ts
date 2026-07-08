import { Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationType, Prisma, XpSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const DEFAULT_BADGES = [
  {
    code: 'first-step',
    title: 'First Step',
    description: 'Earned for taking your first learning action.',
    icon: 'spark',
    xpThreshold: 50,
  },
  {
    code: 'practice-pro',
    title: 'Practice Pro',
    description: 'Completed a meaningful amount of lessons.',
    icon: 'guitar',
    xpThreshold: 500,
  },
  {
    code: 'community-voice',
    title: 'Community Voice',
    description: 'Shared helpful posts in the forum.',
    icon: 'chat',
    xpThreshold: 200,
  },
  {
    code: 'streak-keeper',
    title: 'Streak Keeper',
    description: 'Kept your learning streak alive.',
    icon: 'flame',
    xpThreshold: 300,
  },
];

@Injectable()
export class GamificationService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    const badgeCount = await this.prisma.badge.count();
    if (badgeCount === 0) {
      await this.prisma.badge.createMany({
        data: DEFAULT_BADGES,
      });
    }
  }

  async awardXp(data: {
    userId: string;
    source: XpSource;
    points: number;
    instrument?: string | null;
    meta?: Record<string, unknown> | null;
  }) {
    if (data.points <= 0) {
      return null;
    }

    const event = await this.prisma.xpEvent.create({
      data: {
        userId: data.userId,
        source: data.source,
        points: data.points,
        instrument: data.instrument ?? null,
        meta: data.meta
          ? (data.meta as Prisma.InputJsonValue)
          : undefined,
      },
    });

    await this.bumpStreak(data.userId);
    await this.evaluateBadges(data.userId);
    return event;
  }

  async bumpStreak(userId: string) {
    const streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    const now = new Date();
    const today = this.normalizeDate(now);

    if (!streak) {
      return this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveAt: today,
        },
      });
    }

    if (streak.lastActiveAt) {
      const lastActive = this.normalizeDate(streak.lastActiveAt);
      const dayDiff = this.dayDifference(lastActive, today);

      if (dayDiff === 0) {
        return streak;
      }

      const currentStreak = dayDiff === 1 ? streak.currentStreak + 1 : 1;
      const longestStreak = Math.max(streak.longestStreak, currentStreak);

      return this.prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak,
          longestStreak,
          lastActiveAt: today,
        },
      });
    }

    return this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveAt: today,
      },
    });
  }

  async getMyStats(userId: string) {
    const [xpResult, streak, badgeCount, enrollmentCount, sessionCount, forumCount] =
      await this.prisma.$transaction([
        this.prisma.xpEvent.aggregate({
          where: { userId },
          _sum: { points: true },
        }),
        this.prisma.userStreak.findUnique({ where: { userId } }),
        this.prisma.userBadge.count({ where: { userId } }),
        this.prisma.enrollment.count({ where: { userId } }),
        this.prisma.liveSession.count({
          where: { OR: [{ instructorId: userId }, { studentId: userId }] },
        }),
        this.prisma.forumThread.count({ where: { authorId: userId } }),
      ]);

    const totalXp = xpResult._sum.points ?? 0;
    const { level, levelName, xpIntoLevel, xpForNextLevel } = this.levelFromXp(totalXp);

    return {
      totalXp,
      level,
      levelName,
      xpIntoLevel,
      xpForNextLevel,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      badgeCount,
      enrollmentCount,
      sessionCount,
      forumCount,
    };
  }

  /** 10-level system (Beginner → Virtuoso), 500 XP per level (spec §3.3). */
  private levelFromXp(totalXp: number) {
    const PER_LEVEL = 500;
    const names = [
      'Beginner',
      'Novice',
      'Apprentice',
      'Student',
      'Adept',
      'Skilled',
      'Advanced',
      'Expert',
      'Master',
      'Virtuoso',
    ];
    const level = Math.min(names.length, Math.floor(totalXp / PER_LEVEL) + 1);
    return {
      level,
      levelName: names[level - 1],
      xpIntoLevel: level >= names.length ? PER_LEVEL : totalXp % PER_LEVEL,
      xpForNextLevel: PER_LEVEL,
    };
  }

  async getMyBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async getLeaderboard(params: { instrument?: string; limit?: number }) {
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const where = params.instrument
      ? { instrument: params.instrument }
      : undefined;

    const events = await this.prisma.xpEvent.findMany({
      where: {
        ...(where ?? {}),
        createdAt: {
          gte: this.sevenDaysAgo(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    const map = new Map<string, {
      user: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
        role: string;
      };
      xp: number;
    }>();

    for (const event of events) {
      const current = map.get(event.userId);
      if (!current) {
        map.set(event.userId, {
          user: event.user,
          xp: event.points,
        });
        continue;
      }
      current.xp += event.points;
    }

    const rows = [...map.values()]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((row, index) => ({
        rank: index + 1,
        ...row,
      }));

    return {
      instrument: params.instrument ?? null,
      items: rows,
    };
  }

  private async evaluateBadges(userId: string) {
    const [xpTotal, replyCount, threadCount, lessonCompletions, streak] =
      await this.prisma.$transaction([
        this.prisma.xpEvent.aggregate({
          where: { userId },
          _sum: { points: true },
        }),
        this.prisma.forumReply.count({ where: { authorId: userId } }),
        this.prisma.forumThread.count({ where: { authorId: userId } }),
        this.prisma.lessonProgress.count({
          where: {
            enrollment: { userId },
            completed: true,
          },
        }),
        this.prisma.userStreak.findUnique({ where: { userId } }),
      ]);

    const existingBadgeCodes = new Set(
      (
        await this.prisma.userBadge.findMany({
          where: { userId },
          include: { badge: true },
        })
      ).map((row) => row.badge.code),
    );

    const allBadges = await this.prisma.badge.findMany();
    const badgeLookup = new Map(allBadges.map((badge) => [badge.code, badge]));

    const awardIfMissing = async (code: string) => {
      if (existingBadgeCodes.has(code)) {
        return;
      }
      const badge = badgeLookup.get(code);
      if (!badge) {
        return;
      }
      await this.prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });
      existingBadgeCodes.add(code);
      await this.notificationsService.createNotification({
        userId,
        type: NotificationType.SYSTEM,
        title: `Badge earned: ${badge.title}`,
        body: badge.description,
        link: '/profile',
      });
    };

    if ((xpTotal._sum.points ?? 0) >= 50) {
      await awardIfMissing('first-step');
    }
    if (lessonCompletions >= 5) {
      await awardIfMissing('practice-pro');
    }
    if (replyCount + threadCount >= 5) {
      await awardIfMissing('community-voice');
    }
    if ((streak?.currentStreak ?? 0) >= 7) {
      await awardIfMissing('streak-keeper');
    }
  }

  private normalizeDate(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private dayDifference(a: Date, b: Date) {
    const diff = b.getTime() - a.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  }

  private sevenDaysAgo() {
    const now = new Date();
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}
