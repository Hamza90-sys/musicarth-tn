import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

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
  @IsBoolean()
  isFreePreview?: boolean;
}
