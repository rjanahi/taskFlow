import {
  IsDateString,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Priority } from '../../generated/prisma/client';

export class CreateWorkItemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string;

  @IsEnum(Priority)
  priority!: Priority;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category!: string;

  @IsDateString()
  dueDate!: string;
}
