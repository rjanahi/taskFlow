import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { Role } from '../generated/prisma/client';
import {
  ATTACHMENT_MIME_TYPE_PATTERN,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './attachments.constants';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { WorkItemQueryDto } from './dto/work-item-query.dto';
import { WorkItemsService } from './work-items.service';

function sanitizeDownloadFilename(filename: string): string {
  return filename.replace(/^.*[\\/]/, '').replace(/[\r\n"]/g, '_');
}

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

  @Post(':id/attachment')
  @Roles(Role.MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),

      limits: {
        fileSize: MAX_ATTACHMENT_SIZE_BYTES,
        files: 1,
        fields: 0,
      },
    }),
  )
  uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_ATTACHMENT_SIZE_BYTES,
        })
        .addFileTypeValidator({
          fileType: ATTACHMENT_MIME_TYPE_PATTERN,
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.workItemsService.uploadAttachment(id, file, currentUser);
  }

  @Get(':id/attachment')
  async getAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const attachment = await this.workItemsService.getAttachmentFile(
      id,
      currentUser,
    );

    return new StreamableFile(createReadStream(attachment.absolutePath), {
      type: attachment.mimeType,
      length: attachment.sizeBytes,
      disposition: `inline; filename="${sanitizeDownloadFilename(
        attachment.originalName,
      )}"`,
    });
  }

  @Delete(':id/attachment')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.workItemsService.removeAttachment(id, currentUser);
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
