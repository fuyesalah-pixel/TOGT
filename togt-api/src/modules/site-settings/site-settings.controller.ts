import { Body, Controller, Get, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';
import { SiteSettingsService } from './site-settings.service';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettings: SiteSettingsService) {}

  @Public()
  @Get('public')
  publicSettings() {
    return this.siteSettings.publicSettings();
  }

  @Get()
  list(@CurrentUser() user: User) {
    return this.siteSettings.listSettings(user);
  }

  @Post()
  update(@Body() dto: UpdateSiteSettingsDto, @CurrentUser() user: User) {
    return this.siteSettings.updateSettings(dto, user);
  }
}
