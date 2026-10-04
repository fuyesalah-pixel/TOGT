import { Module } from '@nestjs/common';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';
import { TranslationService } from '../packages/translation.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [SystemModule],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, TranslationService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
