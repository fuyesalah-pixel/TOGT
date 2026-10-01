import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  enabled?: boolean;

  @IsOptional()
  @Matches(/^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/, { message: 'cron must be 5 space-separated fields, e.g. "0 2 * * *"' })
  cron?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  retentionDays?: number;
}
