import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole, VideoStatus } from '@prisma/client';
import Mux from '@mux/mux-node';
import { PrismaService } from '../../prisma/prisma.service';

const PLAYBACK_TOKEN_TTL = '12h';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly mux: Mux | null;
  private readonly signingKeyId: string;
  private readonly signingPrivateKey: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const tokenId = this.config.get<string>('MUX_TOKEN_ID', '');
    const tokenSecret = this.config.get<string>('MUX_TOKEN_SECRET', '');
    this.signingKeyId = this.config.get<string>('MUX_SIGNING_KEY_ID', '');
    this.signingPrivateKey = this.config.get<string>('MUX_SIGNING_PRIVATE_KEY', '');
    this.webhookSecret = this.config.get<string>('MUX_WEBHOOK_SECRET', '');

    this.mux =
      tokenId && tokenSecret
        ? new Mux({ tokenId, tokenSecret, webhookSecret: this.webhookSecret || null })
        : null;

    if (!this.mux) {
      this.logger.warn(
        'Mux credentials are not configured (MUX_TOKEN_ID / MUX_TOKEN_SECRET). Video uploads are disabled.',
      );
    }
  }

  private client(): Mux {
    if (!this.mux) {
      throw new ServiceUnavailableException('Video service is not configured');
    }
    return this.mux;
  }

  /**
   * Step 2 of the upload flow: create a Mux Direct Upload and hand the signed
   * URL back to the instructor. The video file is PUT straight to Mux by the
   * browser — it never passes through this backend (spec 10.1).
   */
  async createLessonUploadUrl(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.assertCanManageLesson(lesson.section.course.instructorId, userId);

    const corsOrigin = this.config.get<string>('MEDIA_UPLOAD_CORS_ORIGIN', '*');
    const upload = await this.client().video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ['signed'],
      },
    });

    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        muxUploadId: upload.id,
        muxAssetId: null,
        muxPlaybackId: null,
        videoStatus: VideoStatus.PENDING,
      },
    });

    return {
      lessonId: lesson.id,
      uploadId: upload.id,
      uploadUrl: upload.url,
    };
  }

  /**
   * Receives Mux webhooks. Verifies the signature when a webhook secret is
   * configured; otherwise (local dev) it parses the body and logs a warning.
   */
  async handleWebhook(rawBody: string, headers: Record<string, string>) {
    let event: Mux.UnwrapWebhookEvent;

    if (this.webhookSecret && this.mux) {
      try {
        event = this.mux.webhooks.unwrap(rawBody, headers, this.webhookSecret);
      } catch (error) {
        this.logger.warn(`Rejected Mux webhook with invalid signature: ${String(error)}`);
        throw new BadRequestException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('MUX_WEBHOOK_SECRET not set — accepting webhook without signature verification');
      event = JSON.parse(rawBody) as Mux.UnwrapWebhookEvent;
    }

    switch (event.type) {
      case 'video.upload.asset_created':
        await this.onUploadAssetCreated(event.data.id, (event.data as any).asset_id);
        break;
      case 'video.asset.ready':
        await this.onAssetReady(event.data);
        break;
      case 'video.asset.errored':
        await this.markAssetStatus(event.data.id, VideoStatus.ERRORED);
        break;
      default:
        break;
    }

    return { received: true };
  }

  /**
   * Issues a short-lived signed playback token for an enrolled student (or for
   * a free-preview lesson). No public HLS URLs are ever exposed (spec 10.2).
   */
  async getPlaybackToken(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.videoStatus !== VideoStatus.READY || !lesson.muxPlaybackId) {
      throw new BadRequestException('Lesson video is not ready');
    }

    await this.assertCanWatch(lesson, userId);

    if (!this.signingKeyId || !this.signingPrivateKey) {
      throw new ServiceUnavailableException('Playback signing keys are not configured');
    }

    const token = await this.client().jwt.signPlaybackId(lesson.muxPlaybackId, {
      keyId: this.signingKeyId,
      keySecret: this.signingPrivateKey,
      type: 'video',
      expiration: PLAYBACK_TOKEN_TTL,
    });

    return {
      lessonId: lesson.id,
      playbackId: lesson.muxPlaybackId,
      token,
      url: `https://stream.mux.com/${lesson.muxPlaybackId}.m3u8?token=${token}`,
    };
  }

  /**
   * Public preview: issues a signed token for a lesson ONLY if it is flagged as
   * a free preview. Lets the marketing/course page play sample lessons without a
   * login. Any non-preview lesson is rejected, so paid content stays gated.
   */
  async getPreviewPlaybackToken(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        isFreePreview: true,
        videoStatus: true,
        muxPlaybackId: true,
      },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    if (!lesson.isFreePreview) {
      throw new ForbiddenException('This lesson is not available as a free preview');
    }
    if (lesson.videoStatus !== VideoStatus.READY || !lesson.muxPlaybackId) {
      throw new BadRequestException('Lesson video is not ready');
    }
    if (!this.signingKeyId || !this.signingPrivateKey) {
      throw new ServiceUnavailableException('Playback signing keys are not configured');
    }

    const token = await this.client().jwt.signPlaybackId(lesson.muxPlaybackId, {
      keyId: this.signingKeyId,
      keySecret: this.signingPrivateKey,
      type: 'video',
      expiration: PLAYBACK_TOKEN_TTL,
    });

    return {
      lessonId: lesson.id,
      playbackId: lesson.muxPlaybackId,
      token,
      url: `https://stream.mux.com/${lesson.muxPlaybackId}.m3u8?token=${token}`,
    };
  }

  /**
   * Polls Mux for a lesson's current asset status and updates the DB. This is
   * the fallback for environments where Mux webhooks can't reach the backend
   * (e.g. local dev on localhost). In production webhooks do this automatically.
   */
  async reconcileLesson(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: { select: { instructorId: true } } } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    await this.assertCanManageLesson(lesson.section.course.instructorId, userId);

    if (lesson.videoStatus === VideoStatus.READY && lesson.muxPlaybackId) {
      return { lessonId, videoStatus: lesson.videoStatus, muxPlaybackId: lesson.muxPlaybackId };
    }

    // Resolve the Mux asset id from the upload if the webhook never delivered it.
    let assetId = lesson.muxAssetId;
    if (!assetId && lesson.muxUploadId) {
      try {
        const upload = await this.client().video.uploads.retrieve(lesson.muxUploadId);
        assetId = upload.asset_id ?? null;
      } catch (error) {
        this.logger.warn(`Mux upload retrieve failed (${lesson.muxUploadId}): ${String(error)}`);
      }
    }
    if (!assetId) {
      return { lessonId, videoStatus: lesson.videoStatus, muxPlaybackId: null };
    }

    let status: VideoStatus = VideoStatus.PROCESSING;
    let playbackId: string | null = lesson.muxPlaybackId ?? null;
    let duration: number | undefined;
    try {
      const asset = await this.client().video.assets.retrieve(assetId);
      playbackId = asset.playback_ids?.[0]?.id ?? playbackId;
      duration = asset.duration ? Math.round(asset.duration) : undefined;
      if (asset.status === 'ready') status = VideoStatus.READY;
      else if (asset.status === 'errored') status = VideoStatus.ERRORED;
    } catch (error) {
      this.logger.warn(`Mux asset retrieve failed (${assetId}): ${String(error)}`);
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        muxAssetId: assetId,
        muxPlaybackId: playbackId ?? undefined,
        durationSeconds: duration,
        videoStatus: status,
      },
      select: { id: true, videoStatus: true, muxPlaybackId: true },
    });
    return { lessonId: updated.id, videoStatus: updated.videoStatus, muxPlaybackId: updated.muxPlaybackId };
  }

  /** Best-effort deletion of Mux assets when their lessons/courses are removed. */
  async deleteAssets(assetIds: Array<string | null | undefined>) {
    if (!this.mux) return;
    for (const assetId of assetIds) {
      if (!assetId) continue;
      try {
        await this.client().video.assets.delete(assetId);
      } catch (error) {
        this.logger.warn(`Failed to delete Mux asset ${assetId}: ${String(error)}`);
      }
    }
  }

  private async onUploadAssetCreated(uploadId: string, assetId?: string) {
    if (!assetId) return;
    await this.prisma.lesson.updateMany({
      where: { muxUploadId: uploadId },
      data: { muxAssetId: assetId, videoStatus: VideoStatus.PROCESSING },
    });
  }

  private async onAssetReady(asset: {
    id: string;
    playback_ids?: Array<{ id: string }> | null;
    duration?: number | null;
  }) {
    const playbackId = asset.playback_ids?.[0]?.id ?? null;
    await this.prisma.lesson.updateMany({
      where: { muxAssetId: asset.id },
      data: {
        muxPlaybackId: playbackId,
        durationSeconds: asset.duration ? Math.round(asset.duration) : undefined,
        videoStatus: VideoStatus.READY,
      },
    });
  }

  private async markAssetStatus(assetId: string, status: VideoStatus) {
    await this.prisma.lesson.updateMany({
      where: { muxAssetId: assetId },
      data: { videoStatus: status },
    });
  }

  private async assertCanManageLesson(instructorId: string | null, userId: string) {
    if (instructorId && instructorId === userId) return;
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (actor?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot manage this lesson');
    }
  }

  private async assertCanWatch(
    lesson: { isFreePreview: boolean; section: { course: { id: string; instructorId: string | null } } },
    userId: string,
  ) {
    if (lesson.isFreePreview) return;
    if (lesson.section.course.instructorId === userId) return;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: lesson.section.course.id },
      },
      select: { id: true },
    });
    if (enrollment) return;

    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (actor?.role === UserRole.ADMIN) return;

    throw new ForbiddenException('Enroll in this course to watch the lesson');
  }
}
