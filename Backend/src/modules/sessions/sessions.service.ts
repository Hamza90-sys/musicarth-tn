import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  LiveSessionStatus,
  LiveSessionType,
  NotificationType,
  XpSource,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookSessionDto } from './dto/book-session.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateAssignedSessionDto } from './dto/create-assigned-session.dto';
import { RateSessionDto } from './dto/rate-session.dto';
import { GamificationService } from '../gamification/gamification.service';
import { DailyService } from './daily.service';
import { SESSION_REMINDERS_QUEUE } from './sessions.constants';

const SESSION_JOIN_WINDOW_MINUTES = 10;
const SESSION_GRACE_PERIOD_MINUTES = 15;

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private readonly remindersEnabled =
    process.env.SESSION_REMINDERS_ENABLED !== 'false';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly gamificationService: GamificationService,
    private readonly daily: DailyService,
    @InjectQueue(SESSION_REMINDERS_QUEUE) private readonly reminderQueue: Queue,
  ) {}

  async createAvailability(
    instructorId: string,
    dto: CreateAvailabilityDto,
  ) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid start time');
    }
    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException('Start time must be in the future');
    }

    // 1:1 always has a single seat; a group slot can sell 2–12 seats, each of
    // which is paid for and booked separately.
    const sessionType = dto.sessionType ?? LiveSessionType.ONE_ON_ONE;
    const capacity =
      sessionType === LiveSessionType.GROUP
        ? Math.min(12, Math.max(2, dto.capacity ?? 2))
        : 1;

    return this.prisma.sessionAvailability.create({
      data: {
        instructorId,
        title: dto.title,
        instrument: dto.instrument,
        notes: dto.notes ?? null,
        price: dto.price,
        startsAt,
        durationMinutes: dto.durationMinutes,
        sessionType,
        capacity,
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async listOpenAvailability() {
    return this.prisma.sessionAvailability.findMany({
      where: {
        isBooked: false,
        startsAt: {
          gte: new Date(),
        },
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  async listAvailabilityForInstructor(instructorId: string) {
    return this.prisma.sessionAvailability.findMany({
      where: {
        instructorId,
        startsAt: {
          gte: new Date(),
        },
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        bookedSession: {
          select: {
            id: true,
            status: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  async listMySessions(userId: string) {
    return this.prisma.liveSession.findMany({
      where: {
        OR: [
          { instructorId: userId },
          { studentId: userId },
          { participants: { some: { userId } } },
        ],
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
        participants: {
          select: {
            user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          },
        },
        availability: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  /**
   * Books a student into an availability slot. 1:1 slots hold a single seat;
   * group slots hold several, so many students each pay for and join the *same*
   * live session. Seats are claimed atomically so a slot can never oversell,
   * and the call is idempotent (the payment verify path may retry it).
   */
  async bookSession(userId: string, dto: BookSessionDto) {
    const availability = await this.prisma.sessionAvailability.findUnique({
      where: { id: dto.availabilityId },
      include: {
        instructor: true,
        bookedSession: { select: { id: true, participants: { select: { userId: true } } } },
      },
    });

    if (!availability) {
      throw new NotFoundException('Availability slot not found');
    }

    // Already in this session? Return it unchanged (idempotent).
    if (availability.bookedSession?.participants.some((p) => p.userId === userId)) {
      return this.getBookedSession(availability.bookedSession.id);
    }

    // Atomically claim a seat; fails cleanly when the slot is full.
    const claimed = await this.prisma.sessionAvailability.updateMany({
      where: { id: availability.id, seatsTaken: { lt: availability.capacity } },
      data: { seatsTaken: { increment: 1 } },
    });
    if (claimed.count === 0) {
      throw new ConflictException('This session is full');
    }

    try {
      const endsAt = new Date(
        availability.startsAt.getTime() + availability.durationMinutes * 60 * 1000,
      );

      let session;
      if (availability.bookedSession) {
        // Group slot with an existing session — just add this participant.
        session = await this.prisma.liveSession.update({
          where: { id: availability.bookedSession.id },
          data: { participants: { create: { userId } } },
          include: this.bookedSessionInclude,
        });
      } else {
        // First booking — provision the shared room and create the session.
        const room = await this.provisionRoom(endsAt);
        session = await this.prisma.liveSession.create({
          data: {
            availabilityId: availability.id,
            title: availability.title,
            instrument: availability.instrument,
            notes: availability.notes,
            price: availability.price,
            startsAt: availability.startsAt,
            endsAt,
            durationMinutes: availability.durationMinutes,
            status: LiveSessionStatus.SCHEDULED,
            sessionType: availability.sessionType,
            capacity: availability.capacity,
            roomName: room.name,
            roomUrl: room.url,
            instructorId: availability.instructorId,
            studentId:
              availability.sessionType === LiveSessionType.ONE_ON_ONE ? userId : null,
            participants: { create: { userId } },
          },
          include: this.bookedSessionInclude,
        });

        await this.scheduleSessionJobs({
          id: session.id,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          instructorId: session.instructorId,
          studentId: session.studentId,
          title: session.title,
        });
      }

      // Close the slot once the final seat is sold.
      const fresh = await this.prisma.sessionAvailability.findUnique({
        where: { id: availability.id },
        select: { seatsTaken: true, capacity: true },
      });
      if (fresh && fresh.seatsTaken >= fresh.capacity) {
        await this.prisma.sessionAvailability
          .update({ where: { id: availability.id }, data: { isBooked: true } })
          .catch(() => undefined);
      }

      const student = session.participants.find((p) => p.user.id === userId)?.user;
      await Promise.all([
        this.notificationsService.createNotification({
          userId,
          type: NotificationType.SESSION,
          title: 'Session booked',
          body: `${session.title} is booked for ${session.startsAt.toLocaleString()}.`,
          link: `/sessions/${session.id}`,
        }),
        this.notificationsService.createNotification({
          userId: session.instructorId,
          type: NotificationType.SESSION,
          title: 'New session booking',
          body: `${student?.fullName ?? 'A student'} booked ${session.title}.`,
          link: `/sessions/${session.id}`,
        }),
      ]);

      return session;
    } catch (error) {
      // Release the claimed seat if we couldn't complete the booking.
      await this.prisma.sessionAvailability
        .updateMany({
          where: { id: availability.id, seatsTaken: { gt: 0 } },
          data: { seatsTaken: { decrement: 1 } },
        })
        .catch(() => undefined);
      throw error;
    }
  }

  private readonly bookedSessionInclude = {
    instructor: { select: { id: true, fullName: true, email: true } },
    student: { select: { id: true, fullName: true, email: true } },
    participants: {
      select: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
    },
    availability: true,
  } as const;

  private getBookedSession(sessionId: string) {
    return this.prisma.liveSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: this.bookedSessionInclude,
    });
  }

  /** Students enrolled in any of this instructor's courses — the people they can schedule with. */
  async listEligibleStudents(instructorId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { course: { instructorId } },
      select: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const seen = new Set<string>();
    const students: Array<{ id: string; fullName: string; email: string; avatarUrl: string | null }> = [];
    for (const enrollment of enrollments) {
      if (enrollment.user && !seen.has(enrollment.user.id)) {
        seen.add(enrollment.user.id);
        students.push(enrollment.user);
      }
    }
    return students;
  }

  /**
   * Instructor-driven scheduling (spec: instructor assigns participants directly).
   * 1:1 = exactly one student; GROUP = up to 5. Creates the room, the session, the
   * participant rows, and notifies every assigned student.
   */
  async createAssignedSession(instructorId: string, dto: CreateAssignedSessionDto) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid start time');
    }
    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException('Start time must be in the future');
    }

    const studentIds = [...new Set(dto.studentIds)];
    if (dto.sessionType === LiveSessionType.ONE_ON_ONE && studentIds.length !== 1) {
      throw new BadRequestException('A 1:1 session must have exactly one student');
    }
    if (dto.sessionType === LiveSessionType.GROUP && (studentIds.length < 1 || studentIds.length > 5)) {
      throw new BadRequestException('A group session must have between 1 and 5 students');
    }

    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds }, role: UserRole.STUDENT, deletedAt: null },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      throw new BadRequestException('One or more selected students are invalid');
    }

    const endsAt = new Date(startsAt.getTime() + dto.durationMinutes * 60 * 1000);
    const room = await this.provisionRoom(endsAt);
    const capacity = dto.sessionType === LiveSessionType.ONE_ON_ONE ? 1 : 5;

    const session = await this.prisma.liveSession.create({
      data: {
        title: dto.title,
        instrument: dto.instrument,
        notes: dto.notes ?? null,
        price: dto.price ?? 0,
        startsAt,
        endsAt,
        durationMinutes: dto.durationMinutes,
        status: LiveSessionStatus.SCHEDULED,
        sessionType: dto.sessionType,
        capacity,
        roomName: room.name,
        roomUrl: room.url,
        instructorId,
        studentId: dto.sessionType === LiveSessionType.ONE_ON_ONE ? studentIds[0] : null,
        participants: { create: studentIds.map((userId) => ({ userId })) },
      },
      include: {
        instructor: { select: { id: true, fullName: true, email: true } },
        participants: {
          select: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
        },
      },
    });

    await Promise.all(
      studentIds.map((userId) =>
        this.notificationsService.createNotification({
          userId,
          type: NotificationType.SESSION,
          title: 'New session scheduled',
          body: `${session.title} on ${startsAt.toLocaleString()}`,
          link: '/sessions',
        }),
      ),
    );

    await this.scheduleSessionJobs({
      id: session.id,
      startsAt,
      endsAt,
      instructorId,
      studentId: session.studentId,
      title: session.title,
    });

    return session;
  }

  private async provisionRoom(endsAt: Date): Promise<{ name: string; url: string | null }> {
    if (!this.daily.isConfigured) {
      return { name: `room-${randomUUID()}`, url: null };
    }
    try {
      const room = await this.daily.createRoom({
        namePrefix: 'musiqa',
        expiresAt: new Date(endsAt.getTime() + SESSION_GRACE_PERIOD_MINUTES * 60 * 1000),
      });
      return { name: room.name, url: room.url };
    } catch {
      // Don't lose the booking if the provider is briefly unavailable; the room
      // can be reconciled later, and getRoom degrades gracefully.
      return { name: `room-${randomUUID()}`, url: null };
    }
  }

  async getRoom(sessionId: string, userId: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
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
        participants: { select: { userId: true } },
        availability: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const isParticipant = session.participants.some((p) => p.userId === userId);
    if (
      session.instructorId !== userId &&
      session.studentId !== userId &&
      !isParticipant
    ) {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (actor?.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You cannot access this session');
      }
    }

    if (session.status === LiveSessionStatus.CANCELLED) {
      throw new ConflictException('This session was cancelled');
    }

    const now = new Date();
    const joinWindowStartsAt = new Date(
      session.startsAt.getTime() - SESSION_JOIN_WINDOW_MINUTES * 60 * 1000,
    );
    const roomExpiresAt = new Date(
      session.endsAt.getTime() + SESSION_GRACE_PERIOD_MINUTES * 60 * 1000,
    );

    if (now < joinWindowStartsAt) {
      throw new ForbiddenException(
        'Join opens 10 minutes before the scheduled start',
      );
    }

    if (now > roomExpiresAt) {
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { status: LiveSessionStatus.COMPLETED },
      });
      throw new ConflictException('This session room has expired');
    }

    const nextStatus =
      now >= session.startsAt && now <= roomExpiresAt
        ? LiveSessionStatus.ACTIVE
        : session.status;

    if (nextStatus !== session.status) {
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { status: nextStatus },
      });
      session.status = nextStatus;
    }

    const isInstructor = session.instructorId === userId;
    const participant = isInstructor ? session.instructor : session.student;
    const roomToken = this.daily.isConfigured
      ? await this.daily.createMeetingToken({
          roomName: session.roomName,
          userName: participant?.fullName ?? (isInstructor ? 'Instructor' : 'Student'),
          isOwner: isInstructor,
          expiresAt: roomExpiresAt,
        })
      : `token-${session.id}`;

    return {
      ...session,
      roomToken,
      roomUrl: session.roomUrl,
      joinWindowStartsAt,
      roomExpiresAt,
    };
  }

  async cancelSession(sessionId: string, userId: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        instructor: true,
        student: true,
        availability: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isParticipant =
      session.instructorId === userId || session.studentId === userId;

    if (!isParticipant && actor?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot cancel this session');
    }

    if (session.status === LiveSessionStatus.CANCELLED) {
      return session;
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      if (session.availabilityId) {
        await tx.sessionAvailability.update({
          where: { id: session.availabilityId },
          data: { isBooked: false },
        });
      }

      return tx.liveSession.update({
        where: { id: session.id },
        data: { status: LiveSessionStatus.CANCELLED },
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
      });
    });

    await this.daily.deleteRoom(cancelled.roomName);

    const otherUserId =
      userId === cancelled.instructorId ? cancelled.studentId : cancelled.instructorId;

    if (otherUserId) {
      await this.notificationsService.createNotification({
        userId: otherUserId,
        type: NotificationType.SESSION,
        title: 'Session cancelled',
        body: `${cancelled.title} was cancelled by ${userId === cancelled.instructorId ? cancelled.instructor.fullName : cancelled.student?.fullName ?? 'the student'}.`,
        link: `/sessions/${cancelled.id}`,
      });
    }

    return cancelled;
  }

  async rateSession(sessionId: string, userId: string, dto: RateSessionDto) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        instructor: true,
        student: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.studentId !== userId) {
      throw new ForbiddenException('Only the student can rate a session');
    }

    if (session.status !== LiveSessionStatus.COMPLETED && new Date() < session.endsAt) {
      throw new ForbiddenException('Sessions can be rated after they finish');
    }

    const rated = await this.prisma.liveSession.update({
      where: { id: session.id },
      data: {
        rating: dto.rating,
        ratingNote: dto.note ?? null,
        ratedAt: new Date(),
        completedAt: new Date(),
        status: LiveSessionStatus.COMPLETED,
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
    });

    await this.notificationsService.createNotification({
      userId: rated.instructorId,
      type: NotificationType.SESSION,
      title: 'New session rating',
      body: `${rated.student?.fullName ?? 'A student'} rated ${rated.title} ${dto.rating}/5.`,
      link: `/sessions/${rated.id}`,
    });

    await this.gamificationService.awardXp({
      userId,
      source: XpSource.SESSION_COMPLETION,
      points: 100,
      instrument: rated.instrument,
      meta: {
        sessionId: rated.id,
        rating: dto.rating,
      },
    });

    return rated;
  }

  private async scheduleSessionJobs(session: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    instructorId: string;
    studentId: string | null;
    title: string;
  }) {
    // Session reminders run on a BullMQ queue (requires Redis >= 5). When the
    // queue is disabled (e.g. local dev on an older Redis), skip scheduling so a
    // booking never fails on the reminder pipeline.
    if (!this.remindersEnabled) {
      return;
    }

    const now = Date.now();
    const start = session.startsAt.getTime();
    const completeAt =
      session.endsAt.getTime() + SESSION_GRACE_PERIOD_MINUTES * 60 * 1000;

    const jobs: Array<{ name: string; runAt: number }> = [
      { name: 'session.reminder.24h', runAt: start - 24 * 60 * 60 * 1000 },
      { name: 'session.reminder.1h', runAt: start - 60 * 60 * 1000 },
      { name: 'session.reminder.15m', runAt: start - 15 * 60 * 1000 },
      { name: 'session.complete', runAt: completeAt },
    ];

    const data = {
      sessionId: session.id,
      instructorId: session.instructorId,
      studentId: session.studentId,
      title: session.title,
    };

    try {
      await Promise.all(
        jobs
          .filter((job) => job.runAt > now)
          .map((job) =>
            this.reminderQueue.add(
              job.name,
              { ...data, reminder: job.name },
              {
                delay: job.runAt - now,
                jobId: `${session.id}:${job.name}`,
                removeOnComplete: true,
                removeOnFail: 100,
              },
            ),
          ),
      );
    } catch (error) {
      // Never let a queue/Redis hiccup break the booking itself.
      this.logger.warn(
        `Could not schedule reminders for session ${session.id}: ${String(error)}`,
      );
    }
  }
}
