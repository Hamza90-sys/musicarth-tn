import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EnrollCourseDto } from './dto/enroll-course.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  async enroll(
    @CurrentUser() user: { sub: string },
    @Body() dto: EnrollCourseDto,
  ) {
    return this.enrollmentsService.enroll(user.sub, dto);
  }

  @Get('me')
  async listMine(@CurrentUser() user: { sub: string }) {
    return this.enrollmentsService.listMyEnrollments(user.sub);
  }

  @Patch(':courseId/progress')
  async updateProgress(
    @CurrentUser() user: { sub: string },
    @Param('courseId') courseId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.enrollmentsService.updateProgress(user.sub, courseId, dto);
  }
}

