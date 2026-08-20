import { IsArray, IsDateString, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateTicketDto {
  @IsString() airline!: string;
  @IsString() flightNumber!: string;
  @IsString() origin!: string;
  @IsString() destination!: string;
  @IsDateString() departureAt!: string;
  @IsOptional() @IsDateString() arrivalAt?: string;
  @IsString() passengerName!: string;
  @IsArray() passengerDetails!: unknown[];
  @IsOptional() @IsString() seat?: string;
  @IsOptional() @IsString() cabinClass?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsNumber() @Min(0) totalAmount!: number;
  @IsOptional() @IsString() currency?: string;
}
