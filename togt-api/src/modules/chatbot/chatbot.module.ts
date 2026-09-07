import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { SystemModule } from '../system/system.module';

@Module({ imports: [SystemModule], controllers: [ChatbotController], providers: [ChatbotService], exports: [ChatbotService] })
export class ChatbotModule {}
