import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LiveSessionStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SESSION_REMINDERS_QUEUE } from './sessions.constants';

type SessionReminderJob = {
  sessionId: string;
  instructorId: string;
  studentId: string | null;
  title: string;
  reminder: 'session.reminder.24h' | 'session.reminder.1h' | 'session.reminder.15m' | 'session.complete';
};

@Processor(SESSION_REMINDERS_QUEUE)
@Injectable()
export class SessionsReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(SessionsReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<SessionReminderJob>) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: job.data.sessionId },
    });

    if (!session || session.status === LiveSessionStatus.CANCELLED) {
      return;
    }

    if (job.name === 'session.complete') {
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: {
          status: LiveSessionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await this.notificationsService.createNotification({
        userId: session.studentId ?? session.instructorId,
        type: NotificationType.SESSION,
        title: 'Session finished',
        body: `Your session "${session.title}" has ended. Please leave a rating when you have a moment.`,
        link: `/sessions/${session.id}`,
      });
      return;
    }

    const label =
      job.name === 'session.reminder.24h'
        ? '24 hours'
        : job.name === 'session.reminder.1h'
          ? '1 hour'
          : '15 minutes';

    await Promise.all(
      [session.studentId, session.instructorId]
        .filter((value): value is string => Boolean(value))
        .map((userId) =>
          this.notificationsService.createNotification({
            userId,
            type: NotificationType.SESSION,
            title: `Session reminder - ${label}`,
            body: `Your live session "${session.title}" starts in ${label}.`,
            link: `/sessions/${session.id}`,
          }),
        ),
    );
  }
}
