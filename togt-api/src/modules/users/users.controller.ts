import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { UsersService } from './users.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.WORKER, Role.ADMIN, Role.TECH)
  findAll(@Query() query: QueryUsersDto) {
    return this.users.findAll(query);
  }

  @Post('device-token')
  registerDeviceToken(@Body('token') token: string, @Body('platform') platform: string | undefined, @CurrentUser() actor: User) {
    if (!token?.trim()) throw new ForbiddenException('Device token is required');
    return this.users.registerDeviceToken(actor.id, token.trim(), platform);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: User) {
    const privileged = actor.role === Role.WORKER || actor.role === Role.ADMIN || actor.role === Role.TECH;
    if (!privileged && actor.id !== id) throw new ForbiddenException('Not allowed');
    return this.users.findOne(id);
  }

  @Get(':id/changes')
  getChanges(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.users.getChanges(id, actor);
  }

  @Post()
  @Roles(Role.WORKER, Role.ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: User) {
    return this.users.create(dto, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: User) {
    return this.users.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  terminate(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.users.terminate(id, actor);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  setStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'TERMINATED',
    @CurrentUser() actor: User,
  ) {
    if (status !== 'ACTIVE' && status !== 'TERMINATED') {
      throw new ForbiddenException('Invalid user status');
    }
    return this.users.setStatus(id, status, actor);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  changeRole(@Param('id') id: string, @Body() dto: ChangeRoleDto, @CurrentUser() actor: User) {
    return this.users.changeRole(id, dto.role, actor);
  }
}
