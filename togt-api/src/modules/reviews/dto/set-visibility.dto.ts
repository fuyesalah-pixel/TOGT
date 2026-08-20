import { IsBoolean } from 'class-validator';

export class SetVisibilityDto {
  @IsBoolean()
  isVisible: boolean;
}
