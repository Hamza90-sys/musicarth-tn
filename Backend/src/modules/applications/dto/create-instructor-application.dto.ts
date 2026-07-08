import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInstructorApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MaxLength(80)
  country!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  instruments!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivation?: string;
}
