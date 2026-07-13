import { Type } from 'class-transformer';
import { LiveSessionType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAvailabilityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  instrument!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsDateString()
  startsAt!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(15)
  durationMinutes!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(LiveSessionType)
  sessionType?: LiveSessionType;

  // Number of seats for a group slot. Ignored for 1:1 (forced to 1).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(12)
  capacity?: number;
}
