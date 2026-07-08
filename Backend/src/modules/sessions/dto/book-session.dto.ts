import { IsString, MinLength } from 'class-validator';

export class BookSessionDto {
  @IsString()
  @MinLength(1)
  availabilityId!: string;
}
