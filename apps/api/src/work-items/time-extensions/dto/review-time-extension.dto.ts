import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewTimeExtensionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
