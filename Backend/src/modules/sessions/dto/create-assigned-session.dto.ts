import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { LiveSessionType } from '@prisma/client';

export class CreateAssignedSessionDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(80)
  instrument!: string;

  @IsISO8601()
  startsAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMinutes!: number;

  @IsEnum(LiveSessionType)
  sessionType!: LiveSessionType;

  // 1 student for ONE_ON_ONE, up to 5 for GROUP (validated against type in the service).
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsUUID('all', { each: true })
  studentIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
}
