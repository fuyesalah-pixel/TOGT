import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class AddMembersDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  userIds: string[];

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}
