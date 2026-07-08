import { IsOptional, IsString, MaxLength, MinLength, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'fr', 'ar'])
  languagePreference?: string;

  // Accepts a regular URL or a small (client-resized) data URL.
  @IsOptional()
  @IsString()
  @MaxLength(300000)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  // Payout details (instructors) — where their monthly earnings get sent.
  @IsOptional()
  @IsIn(['bank', 'flouci'])
  payoutMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  bankRib?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankAccountHolder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  flouciNumber?: string;
}
