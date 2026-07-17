import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTimeExtensionDto {
  @IsDateString()
  proposedDueDate!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason!: string;
}
