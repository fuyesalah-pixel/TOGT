import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CurrencyModule } from '../currency/currency.module';
import { SystemModule } from '../system/system.module';
import { DuffelController } from './duffel.controller';
import { DuffelService } from './duffel.service';

@Module({
  imports: [NotificationsModule, CurrencyModule, SystemModule],
  controllers: [DuffelController],
  providers: [DuffelService],
  exports: [DuffelService],
})
export class DuffelModule {}
