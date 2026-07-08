import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { ForumService } from './forum.service';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('threads')
  async listThreads(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.forumService.listThreads({
      category,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('threads/:threadId')
  async getThread(
    @Param('threadId') threadId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.forumService.getThread(
      threadId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Post('threads')
  @UseGuards(JwtAuthGuard)
  async createThread(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateThreadDto,
  ) {
    return this.forumService.createThread(user.sub, dto);
  }

  @Post('threads/:threadId/replies')
  @UseGuards(JwtAuthGuard)
  async replyToThread(
    @CurrentUser() user: { sub: string },
    @Param('threadId') threadId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.forumService.replyToThread(threadId, user.sub, dto);
  }

  @Post('threads/:threadId/upvote')
  @UseGuards(JwtAuthGuard)
  async toggleUpvote(
    @CurrentUser() user: { sub: string },
    @Param('threadId') threadId: string,
  ) {
    return this.forumService.toggleUpvote(threadId, user.sub);
  }

  @Post('threads/:threadId/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async pinThread(
    @Param('threadId') threadId: string,
    @Body('pinned') pinned: string | boolean,
  ) {
    return this.forumService.pinThread(
      threadId,
      pinned === true || pinned === 'true',
    );
  }

  @Post('threads/:threadId/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async lockThread(
    @Param('threadId') threadId: string,
    @Body('locked') locked: string | boolean,
  ) {
    return this.forumService.lockThread(
      threadId,
      locked === true || locked === 'true',
    );
  }

  @Post('threads/:threadId/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async hideThread(
    @Param('threadId') threadId: string,
    @Body('hidden') hidden: string | boolean,
    @Body('reason') reason?: string,
  ) {
    return this.forumService.hideThread(
      threadId,
      hidden === true || hidden === 'true',
      reason,
    );
  }

  @Post('replies/:replyId/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async hideReply(
    @Param('replyId') replyId: string,
    @Body('hidden') hidden: string | boolean,
    @Body('reason') reason?: string,
  ) {
    return this.forumService.hideReply(
      replyId,
      hidden === true || hidden === 'true',
      reason,
    );
  }

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  async reportContent(
    @CurrentUser() user: { sub: string },
    @Body('targetType') targetType: 'FORUM_THREAD' | 'FORUM_REPLY' | 'COURSE' | 'USER' | 'SESSION',
    @Body('targetId') targetId: string,
    @Body('reason') reason: string,
    @Body('details') details?: string,
  ) {
    return this.forumService.reportContent({
      reporterId: user.sub,
      targetType,
      targetId,
      reason,
      details,
    });
  }
}
