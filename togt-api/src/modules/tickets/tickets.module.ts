import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsReminderService } from './tickets-reminder.service';

@Module({ imports: [NotificationsModule, ChatModule], controllers: [TicketsController], providers: [TicketsService, TicketsReminderService] })
export class TicketsModule {}
