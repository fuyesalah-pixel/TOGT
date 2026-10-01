import { IsIn, IsOptional } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsIn(['database', 'full'])
  type?: 'database' | 'full' = 'database';
}
