import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Forgot-password: mints a one-time reset token (same table the invite flow
   * uses) and emails the reset link. Always returns OK so attackers can't probe
   * which emails exist. Until Resend is configured, the link is logged instead.
   */
  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });

    if (user && !user.deletedAt) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      await this.prisma.passwordSetupToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      const base =
        user.role === UserRole.INSTRUCTOR
          ? this.configService.get<string>('INSTRUCTOR_APP_URL', 'http://localhost:5175')
          : user.role === UserRole.ADMIN
            ? this.configService.get<string>('ADMIN_APP_URL', 'http://localhost:5176')
            : this.configService.get<string>('STUDENT_APP_URL', 'http://localhost:5174');
      const link = `${base.replace(/\/$/, '')}/set-password?token=${rawToken}`;

      const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
      if (!apiKey) {
        this.logger.warn(`PASSWORD RESET (no email provider) for ${normalized}: ${link}`);
      } else {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: this.configService.get<string>('MAIL_FROM', 'Musicarth <onboarding@musicarth.local>'),
              to: normalized,
              subject: 'Reset your Musicarth password',
              html: `<p>Hi ${user.fullName},</p><p>Click below to choose a new password. This link expires in 1 hour.</p><p><a href="${link}">Reset your password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
            }),
          });
        } catch (error) {
          this.logger.error(`Failed to send reset email to ${normalized}: ${String(error)}`);
        }
      }
    }

    return { ok: true };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Your account is not active yet. Set your password using the invite link sent after approval.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.usersService.toSafeProfile(user),
      ...tokens,
    };
  }

  async setPassword(dto: SetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const setupToken = await this.prisma.passwordSetupToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!setupToken || setupToken.usedAt || setupToken.expiresAt < new Date()) {
      throw new BadRequestException('This invite link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12),
    );

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: setupToken.userId },
        data: { passwordHash },
      });
      await tx.passwordSetupToken.update({
        where: { id: setupToken.id },
        data: { usedAt: new Date() },
      });
      return updated;
    });

    const tokens = await this.generateTokens(user);
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.usersService.toSafeProfile(user),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.usersService.toSafeProfile(user),
      ...tokens,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshTokenHash(userId, null);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12),
    );
    await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);
  }
}
