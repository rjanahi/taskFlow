import { Injectable } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findMembers() {
    return this.prisma.user.findMany({
      where: {
        role: Role.MEMBER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}