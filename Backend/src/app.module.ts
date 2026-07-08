import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SessionsJobsModule } from './modules/sessions/sessions.jobs.module';
import { ForumModule } from './modules/forum/forum.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { VideoModule } from './modules/video/video.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlatformReviewsModule } from './modules/platform-reviews/platform-reviews.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { validateEnvironment } from './config/env.validation';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    SessionsModule,
    // The reminder worker connects to Redis with blocking commands that require
    // Redis >= 5. Skip it when reminders are disabled (e.g. local dev on an
    // older Redis) so the app doesn't spam connection errors on boot.
    ...(process.env.SESSION_REMINDERS_ENABLED !== 'false'
      ? [SessionsJobsModule]
      : []),
    ForumModule,
    NotificationsModule,
    SearchModule,
    AdminModule,
    UploadsModule,
    VideoModule,
    ApplicationsModule,
    PaymentsModule,
    PlatformReviewsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
