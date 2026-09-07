import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { SystemModule } from '../system/system.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({ imports: [ChatbotModule, SystemModule], controllers: [TelegramController], providers: [TelegramService] })
export class TelegramModule {}
