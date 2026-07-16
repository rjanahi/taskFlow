import { Controller, Get } from '@nestjs/common';
import {
  Roles,
} from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/client';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('members')
  @Roles(Role.MANAGER)
  findMembers() {
    return this.usersService.findMembers();
  }
}