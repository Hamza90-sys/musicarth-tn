import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsInt()
  @Min(1)
  order!: number;
}

