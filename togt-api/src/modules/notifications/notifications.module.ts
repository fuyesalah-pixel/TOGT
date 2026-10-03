import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';
import { FridayKahfScheduler } from './friday-kahf.scheduler';
import { SystemModule } from '../system/system.module';

@Global()
@Module({
  imports: [SystemModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, PushService, FridayKahfScheduler],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
