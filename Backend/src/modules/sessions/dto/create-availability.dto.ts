import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
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
}
