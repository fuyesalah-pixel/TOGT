import { Type } from 'class-transformer';
import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';

const SITE_SETTING_KEYS = ['OKRA_LINK', 'OKRA_IMAGE', 'TICKETING_ENABLED', 'ABOUT_VIDEO_URL', 'ABOUT_TEXT'] as const;
export type SiteSettingKeyDto = (typeof SITE_SETTING_KEYS)[number];

export class UpdateSiteSettingItemDto {
  @IsIn(SITE_SETTING_KEYS)
  key!: SiteSettingKeyDto;

  @IsString()
  value!: string;
}

export class UpdateSiteSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSiteSettingItemDto)
  settings!: UpdateSiteSettingItemDto[];
}
