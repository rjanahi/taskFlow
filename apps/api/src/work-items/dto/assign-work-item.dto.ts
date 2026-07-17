import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AssignWorkItemDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', {
    each: true,
  })
  memberIds!: string[];
}
