import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { ValkeyModule } from './valkey/valkey.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PackagesModule } from './modules/packages/packages.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ChatModule } from './modules/chat/chat.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ContentModule } from './modules/content/content.module';
import { StatsModule } from './modules/stats/stats.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { PaymentModule } from './modules/payment/payment.module';
import { DuffelModule } from './modules/duffel/duffel.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    ValkeyModule,
    AuthModule,
    UsersModule,
    PackagesModule,
    ServiceRequestsModule,
    GroupsModule,
    ChatModule,
    ReviewsModule,
    NotificationsModule,
    UploadsModule,
    ContentModule,
    StatsModule,
    TrackingModule,
    PaymentModule,
    DuffelModule,
    CurrencyModule,
    ChatbotModule,
    TelegramModule,
    TicketsModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
