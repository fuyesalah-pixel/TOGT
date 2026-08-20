import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: User, @Query('page') page?: string, @Query('search') search?: string, @Query('filter') filter?: 'all' | 'unread' | 'read') {
    return this.chat.getConversations(user, { page: page ? Number(page) : 1, search, filter });
  }

  @Get('workers')
  getWorkers() {
    return this.chat.getWorkers();
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: User) {
    return this.chat.getUnreadCount(user);
  }

  @Post('start')
  start(@Body() body: { receiverId?: string; channel?: 'support' | 'worker' }, @CurrentUser() user: User) {
    return this.chat.start(user, body.receiverId, body.channel ?? 'support');
  }

  @Get(':userId/messages')
  getMessages(@Param('userId') userId: string, @CurrentUser() user: User) {
    return this.chat.getMessages(user, userId);
  }

  /** multipart/form-data: receiverId, message, optional single "file" (<=10MB) */
  @Post('send')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  send(
    @Body() dto: SendMessageDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
  ) {
    return this.chat.send(user, dto.receiverId, dto.message, file);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const url = await this.chat.uploadAttachment(file);
    return { url };
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.chat.markRead(id, user);
  }
}
