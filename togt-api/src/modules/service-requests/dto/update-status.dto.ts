import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  assignToMe?: boolean;
}
