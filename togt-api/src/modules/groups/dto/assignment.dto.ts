import { IsIn } from 'class-validator';

export class AssignmentDto {
  @IsIn(['ACCEPTED', 'DECLINED'])
  status: 'ACCEPTED' | 'DECLINED';
}
