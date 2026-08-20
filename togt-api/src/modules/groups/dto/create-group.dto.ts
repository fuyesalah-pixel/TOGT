import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
