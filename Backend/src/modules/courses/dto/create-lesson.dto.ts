import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  titleFr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  titleAr?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  contentFr?: string;

  @IsOptional()
  @IsString()
  contentAr?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @IsOptional()
  @IsBoolean()
  isFreePreview?: boolean;

  @IsInt()
  @Min(1)
  order!: number;
}
