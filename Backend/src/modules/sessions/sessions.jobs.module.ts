import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SessionsReminderProcessor } from './sessions.processor';
import { SESSION_REMINDERS_QUEUE } from './sessions.constants';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue({ name: SESSION_REMINDERS_QUEUE }),
  ],
  providers: [SessionsReminderProcessor],
})
export class SessionsJobsModule {}
