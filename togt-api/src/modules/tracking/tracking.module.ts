import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ imports: [NotificationsModule], controllers: [TrackingController], providers: [TrackingService] })
export class TrackingModule {}
