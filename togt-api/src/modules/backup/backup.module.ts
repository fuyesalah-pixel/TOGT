import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupScheduler } from './backup.scheduler';
import { TelegramBackupModule } from '../telegram/telegram-backup.module';

@Module({
  imports: [TelegramBackupModule],
  controllers: [BackupController],
  providers: [BackupService, BackupScheduler],
  exports: [BackupService],
})
export class BackupModule {}
