import { Type } from 'class-transformer';
import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';

export class UpdateSiteSettingItemDto {
  @IsIn(['OKRA_LINK', 'OKRA_IMAGE', 'TICKETING_ENABLED'])
  key!: 'OKRA_LINK' | 'OKRA_IMAGE' | 'TICKETING_ENABLED';

  @IsString()
  value!: string;
}

export class UpdateSiteSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSiteSettingItemDto)
  settings!: UpdateSiteSettingItemDto[];
}
