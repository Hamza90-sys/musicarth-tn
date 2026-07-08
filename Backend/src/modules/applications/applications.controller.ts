import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import { CreateStudentApplicationDto } from './dto/create-student-application.dto';
import { CreateInstructorApplicationDto } from './dto/create-instructor-application.dto';
import { cvUploadOptions } from './applications.storage';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('student')
  async applyAsStudent(@Body() dto: CreateStudentApplicationDto) {
    const application = await this.applicationsService.createStudentApplication(dto);
    return { id: application.id, status: application.status };
  }

  @Post('instructor')
  @UseInterceptors(FileInterceptor('cv', cvUploadOptions))
  async applyAsInstructor(
    @Body() dto: CreateInstructorApplicationDto,
    @UploadedFile() cv?: Express.Multer.File,
  ) {
    const application = await this.applicationsService.createInstructorApplication(dto, cv);
    return { id: application.id, status: application.status };
  }
}
