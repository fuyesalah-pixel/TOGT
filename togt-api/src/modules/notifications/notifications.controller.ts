import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findMine(@CurrentUser() user: User) {
    return this.notifications.findForUser(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: User) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: User) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notifications.markRead(id, user.id);
  }

  @Patch(':id/confirm-device')
  confirmDevice(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notifications.confirmDevice(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notifications.remove(id, user.id);
  }

  @Delete()
  clearAll(@CurrentUser() user: User) {
    return this.notifications.clearAll(user.id);
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  sendBulk(@Body() dto: BulkNotificationDto) {
    return this.notifications.sendBulk(dto);
  }
}
