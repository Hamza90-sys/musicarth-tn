import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateAssignedSessionDto } from './dto/create-assigned-session.dto';
import { BookSessionDto } from './dto/book-session.dto';
import { RateSessionDto } from './dto/rate-session.dto';
import { SessionsService } from './sessions.service';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('sessions/availability')
  async listOpenAvailability() {
    return this.sessionsService.listOpenAvailability();
  }

  @Get('instructors/:instructorId/availability')
  async listAvailabilityForInstructor(
    @Param('instructorId') instructorId: string,
  ) {
    return this.sessionsService.listAvailabilityForInstructor(instructorId);
  }

  @Post('sessions/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createAvailability(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.sessionsService.createAvailability(user.sub, dto);
  }

  @Post('sessions/book')
  @UseGuards(JwtAuthGuard)
  async bookSession(
    @CurrentUser() user: { sub: string },
    @Body() dto: BookSessionDto,
  ) {
    return this.sessionsService.bookSession(user.sub, dto);
  }

  @Get('sessions/eligible-students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async listEligibleStudents(@CurrentUser() user: { sub: string }) {
    return this.sessionsService.listEligibleStudents(user.sub);
  }

  @Post('sessions/assigned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createAssignedSession(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateAssignedSessionDto,
  ) {
    return this.sessionsService.createAssignedSession(user.sub, dto);
  }

  @Get('sessions/:sessionId/room')
  @UseGuards(JwtAuthGuard)
  async getRoom(
    @CurrentUser() user: { sub: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.sessionsService.getRoom(sessionId, user.sub);
  }

  @Post('sessions/:sessionId/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSession(
    @CurrentUser() user: { sub: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.sessionsService.cancelSession(sessionId, user.sub);
  }

  @Post('sessions/:sessionId/rate')
  @UseGuards(JwtAuthGuard)
  async rateSession(
    @CurrentUser() user: { sub: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: RateSessionDto,
  ) {
    return this.sessionsService.rateSession(sessionId, user.sub, dto);
  }
}
