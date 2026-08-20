import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  /** Public: only active packages. ?type=UMRAH prefix-matches all Umrah types. */
  @Get()
  @Public()
  findActive(@Query('type') type?: string, @Query('destination') destination?: string) {
    return this.packages.findActive({ type, destination });
  }

  @Get('all')
  @Roles(Role.WORKER, Role.ADMIN)
  findAll(@Query('type') type?: string, @Query('destination') destination?: string) {
    return this.packages.findAll({ type, destination });
  }

  @Post()
  @Roles(Role.WORKER, Role.ADMIN)
  create(@Body() dto: CreatePackageDto, @CurrentUser() user: User) {
    return this.packages.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.WORKER, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packages.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.WORKER, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.packages.remove(id);
  }

  @Patch(':id/toggle')
  @Roles(Role.WORKER, Role.ADMIN)
  toggle(@Param('id') id: string) {
    return this.packages.toggle(id);
  }

  @Patch(':id/group')
  @Roles(Role.WORKER, Role.ADMIN)
  setGroup(@Param('id') id: string, @Body('groupId') groupId: string | null) {
    return this.packages.setGroup(id, groupId ?? null);
  }
}
