import { IsEnum, IsString, MinLength } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @IsEnum(TicketStatus) status!: TicketStatus;
  @IsString() @MinLength(1) note!: string;
}
