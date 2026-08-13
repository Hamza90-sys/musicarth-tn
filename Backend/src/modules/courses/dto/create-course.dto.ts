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

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  subtitle?: string;

  @IsString()
  @MinLength(10)
  description!: string;

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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  includedLiveSessions?: number;

  // Admin-only: the instructor this course belongs to (admins build courses on
  // an instructor's behalf).
  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  titleFr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  titleAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descriptionFr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descriptionAr?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  instrument!: string;

  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  // Accepts a regular URL or a small (client-resized) data URL.
  @IsOptional()
  @IsString()
  @MaxLength(1_500_000)
  thumbnailUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
