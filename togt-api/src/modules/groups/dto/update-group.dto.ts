import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { GroupStatus } from '@prisma/client';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}
