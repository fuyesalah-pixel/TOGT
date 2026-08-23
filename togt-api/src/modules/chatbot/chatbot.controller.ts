import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AskChatbotDto } from './dto/ask-chatbot.dto';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}
  @Post('ask') @Public() ask(@Body() dto: AskChatbotDto) { return this.chatbot.ask(dto); }
  @Post('stream') @Public() stream(@Body() dto: AskChatbotDto, @Res() response: Response) { return this.chatbot.stream(dto, response); }
}
