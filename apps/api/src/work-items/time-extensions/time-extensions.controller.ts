import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { Role } from '../../generated/prisma/client';
import { CreateTimeExtensionDto } from './dto/create-time-extension.dto';
import { ReviewTimeExtensionDto } from './dto/review-time-extension.dto';
import { TimeExtensionQueryDto } from './dto/time-extension-query.dto';
import { TimeExtensionsService } from './time-extensions.service';

@Controller()
export class TimeExtensionsController {
  constructor(private readonly timeExtensionsService: TimeExtensionsService) {}

  @Post('work-items/:workItemId/time-extension-requests')
  @Roles(Role.MEMBER)
  create(
    @Param('workItemId', ParseUUIDPipe)
    workItemId: string,
    @Body()
    createDto: CreateTimeExtensionDto,
    @CurrentUser()
    currentUser: AuthenticatedUser,
  ) {
    return this.timeExtensionsService.create(
      workItemId,
      createDto,
      currentUser,
    );
  }

  @Get('time-extension-requests')
  findAll(
    @CurrentUser()
    currentUser: AuthenticatedUser,
    @Query()
    query: TimeExtensionQueryDto,
  ) {
    return this.timeExtensionsService.findAll(currentUser, query);
  }

  @Post('time-extension-requests/:requestId/approve')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('requestId', ParseUUIDPipe)
    requestId: string,
    @Body()
    reviewDto: ReviewTimeExtensionDto,
    @CurrentUser()
    currentUser: AuthenticatedUser,
  ) {
    return this.timeExtensionsService.approve(
      requestId,
      reviewDto,
      currentUser,
    );
  }

  @Post('time-extension-requests/:requestId/reject')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('requestId', ParseUUIDPipe)
    requestId: string,
    @Body()
    reviewDto: ReviewTimeExtensionDto,
    @CurrentUser()
    currentUser: AuthenticatedUser,
  ) {
    return this.timeExtensionsService.reject(requestId, reviewDto, currentUser);
  }
}
