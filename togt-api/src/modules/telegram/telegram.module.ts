import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({ imports: [ChatbotModule], controllers: [TelegramController], providers: [TelegramService] })
export class TelegramModule {}
