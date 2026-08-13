import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  includedLiveSessions?: number;

  // Admin-only: reassign the course to a different instructor.
  @IsOptional()
  @IsString()
  instructorId?: string;
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  whatYouWillLearn?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  requirements?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  instrument?: string;

  @IsOptional()
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number | null;

  // Accepts a regular URL or a small (client-resized) data URL.
  @IsOptional()
  @IsString()
  @MaxLength(1_500_000)
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
