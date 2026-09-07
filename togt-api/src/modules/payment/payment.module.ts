import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { DuffelModule } from '../duffel/duffel.module';
import { PaymentController, PaymentStatusController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [NotificationsModule, DuffelModule, SystemModule],
  controllers: [PaymentController, PaymentStatusController],
  providers: [PaymentService],
})
export class PaymentModule {}
