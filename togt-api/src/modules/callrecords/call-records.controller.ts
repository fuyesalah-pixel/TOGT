import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CallRecordsService } from './call-records.service';
import { CreateCallRecordDto } from './dto/create-call-record.dto';
import { QueryCallRecordsDto } from './dto/query-call-records.dto';
import { UpdateCallRecordDto } from './dto/update-call-record.dto';

@Controller('call-records')
export class CallRecordsController {
  constructor(private readonly callRecords: CallRecordsService) {}

  @Get()
  @Roles(Role.WORKER, Role.ADMIN, Role.TECH)
  findAll(@Query() query: QueryCallRecordsDto, @CurrentUser() actor: User) {
    return this.callRecords.findAll(query, actor);
  }

  @Post()
  @Roles(Role.WORKER, Role.ADMIN, Role.TECH)
  create(@Body() dto: CreateCallRecordDto, @CurrentUser() actor: User) {
    return this.callRecords.create(dto, actor);
  }

  @Get('used-team-numbers')
  @Roles(Role.WORKER, Role.ADMIN, Role.TECH)
  usedTeamNumbers() {
    return this.callRecords.usedTeamNumbers();
  }

  @Get('verify/:id')
  @Public()
  verify(@Param('id') id: string) {
    return this.callRecords.verify(id);
  }

  @Get(':id')
  @Roles(Role.WORKER, Role.ADMIN, Role.TECH)
  findOne(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.callRecords.findOne(id, actor);
  }

  @Patch(':id')
  @Roles(Role.WORKER, Role.ADMIN, Role.TECH)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCallRecordDto,
    @CurrentUser() actor: User,
  ) {
    return this.callRecords.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.callRecords.remove(id, actor);
  }
}
