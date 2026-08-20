import { ArrayMaxSize, IsArray, IsEnum, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { NotificationType, Role, ServiceType } from '@prisma/client';

export class BulkNotificationDto {
  @IsOptional()
  @IsIn(['all', 'individual', 'selected', 'group', 'service_type', 'role'])
  target?: 'all' | 'individual' | 'selected' | 'group' | 'service_type' | 'role';

  /** If omitted, the notification goes to all ACTIVE users */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  userIds?: string[];

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsString()
  @Length(2, 120)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsString()
  channel?: string; // IN_APP | EMAIL | SMS (default IN_APP)
}
