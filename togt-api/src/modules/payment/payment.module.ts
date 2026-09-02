import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { DuffelModule } from '../duffel/duffel.module';
import { PaymentController, PaymentStatusController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [NotificationsModule, DuffelModule],
  controllers: [PaymentController, PaymentStatusController],
  providers: [PaymentService],
})
export class PaymentModule {}