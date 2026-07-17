import { IsEnum, IsOptional } from 'class-validator';
import { TimeExtensionStatus } from '../../../generated/prisma/client';

export class TimeExtensionQueryDto {
  @IsOptional()
  @IsEnum(TimeExtensionStatus)
  status?: TimeExtensionStatus;
}
