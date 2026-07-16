import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Priority, WorkItemStatus } from '../../generated/prisma/client';

export class WorkItemQueryDto {
  @IsOptional()
  @IsEnum(WorkItemStatus)
  status?: WorkItemStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
