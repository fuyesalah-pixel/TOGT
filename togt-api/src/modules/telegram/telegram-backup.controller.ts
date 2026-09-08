import { Controller, ForbiddenException, Post } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TelegramBackupService } from './telegram-backup.service';

@Controller('telegram/backup')
export class TelegramBackupController {
  constructor(private readonly backup: TelegramBackupService) {}

  @Post('send-test')
  async sendTest(@CurrentUser() user: User) {
    if (user.role !== Role.TECH) throw new ForbiddenException('Tech access required');
    return this.backup.sendTestNotification();
  }
}