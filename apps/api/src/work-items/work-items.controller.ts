import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { Role } from '../generated/prisma/client';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { WorkItemQueryDto } from './dto/work-item-query.dto';
import { WorkItemsService } from './work-items.service';

@Controller('work-items')
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Post()
  @Roles(Role.MANAGER)
  create(
    @Body() createWorkItemDto: CreateWorkItemDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workItemsService.create(createWorkItemDto, currentUser);
  }

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: WorkItemQueryDto,
  ) {
    return this.workItemsService.findAll(currentUser, query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workItemsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(Role.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkItemDto: UpdateWorkItemDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workItemsService.update(id, updateWorkItemDto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.workItemsService.remove(id, currentUser);
  }
}
