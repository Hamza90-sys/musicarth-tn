import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { GamificationModule } from '../gamification/gamification.module';
import { DailyService } from './daily.service';
import { SESSION_REMINDERS_QUEUE } from './sessions.constants';

@Module({
  imports: [
    NotificationsModule,
    GamificationModule,
    BullModule.registerQueue({ name: SESSION_REMINDERS_QUEUE }),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, DailyService],
  exports: [SessionsService],
})
export class SessionsModule {}
