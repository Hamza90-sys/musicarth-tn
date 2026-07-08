import { IsOptional, IsString, MaxLength, MinLength, IsUrl } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsUrl()
  audioUrl?: string;
}
