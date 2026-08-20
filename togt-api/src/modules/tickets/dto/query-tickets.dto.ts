import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class QueryTicketsDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
  @IsOptional() @IsInt() @Min(1) page = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit = 20;
}
