import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import {
  UserRole,
  ApplicationStatus,
  CourseApprovalStatus,
  LiveSessionStatus,
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { ApplicationsService } from '../applications/applications.service';
import { ReviewApplicationDto } from '../applications/dto/review-application.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Get('applications')
  async listApplications(@Query('status') status?: ApplicationStatus) {
    return this.applicationsService.listApplications(status);
  }

  @Get('sessions')
  async listSessions(
    @Query('status') status?: LiveSessionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listSessions({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('applications/:applicationId/review')
  async reviewApplication(
    @Param('applicationId') applicationId: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.applicationsService.reviewApplication(applicationId, dto, user.sub);
  }

  @Get('applications/:applicationId/cv')
  async downloadCv(
    @Param('applicationId') applicationId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { path, fileName } = await this.applicationsService.getApplicationCv(applicationId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    return new StreamableFile(createReadStream(path));
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('users')
  async listUsers(
    @Query('q') q?: string,
    @Query('role') role?: UserRole,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers({
      q,
      role,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('users/:userId/role')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.updateUserRole(userId, role, user.sub);
  }

  @Patch('courses/:courseId/approval')
  async updateCourseApproval(
    @Param('courseId') courseId: string,
    @Body('status') status: CourseApprovalStatus,
    @Body('notes') notes: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.updateCourseApproval(courseId, status, user.sub, notes);
  }

  @Get('reports')
  async listReports(
    @Query('status') status?: ReportStatus,
    @Query('targetType') targetType?: ReportTargetType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listReports({
      status,
      targetType,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('reports/:reportId/resolve')
  async resolveReport(
    @Param('reportId') reportId: string,
    @Body('status') status: ReportStatus,
    @Body('resolutionNotes') resolutionNotes: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminService.resolveReport(reportId, user.sub, {
      status,
      resolutionNotes,
    });
  }
}
