import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VideoService } from './video.service';

@Controller()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('lessons/:lessonId/upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createUploadUrl(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.videoService.createLessonUploadUrl(lessonId, user.sub);
  }

  @Get('lessons/:lessonId/playback')
  @UseGuards(JwtAuthGuard)
  async getPlayback(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.videoService.getPlaybackToken(lessonId, user.sub);
  }

  // Public — only resolves for lessons flagged as a free preview.
  @Get('lessons/:lessonId/preview-playback')
  async getPreviewPlayback(@Param('lessonId') lessonId: string) {
    return this.videoService.getPreviewPlaybackToken(lessonId);
  }

  // Poll Mux for the latest video status (fallback when webhooks can't reach us).
  @Post('lessons/:lessonId/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async syncLessonVideo(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.videoService.reconcileLesson(lessonId, user.sub);
  }

  @Post('webhooks/mux')
  async handleMuxWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
    return this.videoService.handleWebhook(rawBody, headers);
  }
}
