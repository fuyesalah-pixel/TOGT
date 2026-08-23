import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}
  @Post('webhook') @Public() webhook(@Body() update: Record<string, unknown>) { return this.telegram.handleUpdate(update as never).then(() => ({ ok: true })); }
}
