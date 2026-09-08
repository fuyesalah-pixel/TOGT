import { Module } from '@nestjs/common';
import { TelegramBackupController } from './telegram-backup.controller';
import { TelegramBackupService } from './telegram-backup.service';
import { SystemModule } from '../system/system.module';

@Module({ imports: [SystemModule], controllers: [TelegramBackupController], providers: [TelegramBackupService], exports: [TelegramBackupService] })
export class TelegramBackupModule {}