import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { UpdateScheduleDto } from './dto/schedule.dto';

@Controller('backups')
export class BackupController {
  constructor(private readonly backups: BackupService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.backups.list(user);
  }

  @Get('schedule')
  getSchedule(@CurrentUser() user: User) {
    return this.backups.getSchedule(user);
  }

  @Patch('schedule')
  updateSchedule(@Body() dto: UpdateScheduleDto, @CurrentUser() user: User) {
    return this.backups.updateSchedule(dto, user);
  }

  @Post()
  create(@Body() dto: CreateBackupDto, @CurrentUser() user: User) {
    return this.backups.createBackup(dto, user);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @CurrentUser() user: User, @Res() response: Response) {
    const file = await this.backups.download(id, user);
    response.setHeader('Content-Type', 'application/gzip');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    return response.sendFile(file.filePath);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.backups.findOne(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.backups.remove(id, user);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Body() body: { confirm?: string }, @CurrentUser() user: User) {
    return this.backups.restore(id, user, body.confirm ?? '');
  }
}
