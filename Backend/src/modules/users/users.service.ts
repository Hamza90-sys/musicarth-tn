import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GamificationService } from '../gamification/gamification.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly searchService: SearchService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: {
    email: string;
    fullName: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: data.passwordHash,
        role: data.role ?? UserRole.STUDENT,
      },
    });
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async getMyProfile(userId: string) {
    const user = await this.findById(userId);
    const [stats, badges, enrollments, sessions] = await Promise.all([
      this.gamificationService.getMyStats(userId),
      this.gamificationService.getMyBadges(userId),
      this.prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              instrument: true,
              level: true,
              thumbnailUrl: true,
              isPublished: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.listMySessions(userId),
    ]);

    return {
      ...this.toSafeProfile(user),
      languagePreference: user.languagePreference,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      headline: user.headline,
      payoutMethod: user.payoutMethod,
      bankName: user.bankName,
      bankRib: user.bankRib,
      bankAccountHolder: user.bankAccountHolder,
      flouciNumber: user.flouciNumber,
      stats,
      badges,
      enrollments,
      sessions,
      subscription: null,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        languagePreference: dto.languagePreference,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        headline: dto.headline,
        payoutMethod: dto.payoutMethod,
        bankName: dto.bankName,
        bankRib: dto.bankRib,
        bankAccountHolder: dto.bankAccountHolder,
        flouciNumber: dto.flouciNumber,
      },
    });
    await this.searchService.syncUser(userId);
    return {
      ...this.toSafeProfile(user),
      payoutMethod: user.payoutMethod,
      bankName: user.bankName,
      bankRib: user.bankRib,
      bankAccountHolder: user.bankAccountHolder,
      flouciNumber: user.flouciNumber,
    };
  }

  toSafeProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listMySessions(userId: string) {
    return this.prisma.liveSession.findMany({
      where: {
        OR: [{ instructorId: userId }, { studentId: userId }],
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        availability: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  async listMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instrument: true,
            level: true,
            thumbnailUrl: true,
            isPublished: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async softDeleteMyAccount(userId: string, reason?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        deletedReason: reason ?? null,
        refreshTokenHash: null,
      },
    });
    await this.searchService.syncUser(userId);
    return { message: 'Account marked for deletion' };
  }
}
