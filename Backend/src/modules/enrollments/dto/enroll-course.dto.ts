import { IsUUID } from 'class-validator';

export class EnrollCourseDto {
  @IsUUID()
  courseId!: string;
}

