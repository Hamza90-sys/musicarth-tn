import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ReorderSectionsDto, ReorderLessonsDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async listCourses(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.coursesService.listCourses({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // Public — real top-rated instructors for the landing page.
  @Get('instructors/featured')
  async getFeaturedInstructors() {
    return this.coursesService.getFeaturedInstructors();
  }

  @Get(':courseId')
  async getCourseById(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseById(courseId);
  }

  @Get(':courseId/progress')
  @UseGuards(JwtAuthGuard)
  async getCourseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.coursesService.getCourseProgress(courseId, user.sub);
  }

  @Get(':courseId/reviews')
  async listReviews(@Param('courseId') courseId: string) {
    return this.coursesService.listReviews(courseId);
  }

  @Post(':courseId/reviews')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.coursesService.upsertReview(courseId, user.sub, dto);
  }

  @Get(':courseId/certificate')
  @UseGuards(JwtAuthGuard)
  async getCertificate(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { sub: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, fileName } = await this.coursesService.generateCertificate(
      courseId,
      user.sub,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.createCourse(dto, user);
  }

  @Patch(':courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.updateCourse(courseId, dto, user);
  }

  @Post(':courseId/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async publishCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.publishCourse(courseId, user);
  }

  @Post(':courseId/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createSection(
    @Param('courseId') courseId: string,
    @Body() dto: CreateSectionDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.createSection(courseId, dto, user);
  }

  @Post('sections/:sectionId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createLesson(
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.createLesson(sectionId, dto, user);
  }

  @Patch('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.updateLesson(lessonId, dto, user);
  }

  @Delete(':courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.deleteCourse(courseId, user);
  }

  @Delete('sections/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteSection(
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.deleteSection(sectionId, user);
  }

  @Delete('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.deleteLesson(lessonId, user);
  }

  @Patch(':courseId/sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async reorderSections(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderSectionsDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.reorderSections(courseId, dto.sectionIds, user);
  }

  @Patch('sections/:sectionId/lessons/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async reorderLessons(
    @Param('sectionId') sectionId: string,
    @Body() dto: ReorderLessonsDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    return this.coursesService.reorderLessons(sectionId, dto.lessonIds, user);
  }
}
