import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post(':lessonId/progress')
  async updateLessonProgress(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateLessonProgressDto,
  ) {
    return this.coursesService.updateLessonProgress(lessonId, user.sub, dto);
  }
}
