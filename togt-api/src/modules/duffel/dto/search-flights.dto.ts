import { IsDateString, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

export class SearchFlightsDto {
  @IsString() @Matches(/^[A-Z]{3}$/, { message: 'origin must be a 3-letter IATA code' }) origin!: string;
  @IsString() @Matches(/^[A-Z]{3}$/, { message: 'destination must be a 3-letter IATA code' }) destination!: string;
  @IsDateString() departureDate!: string;
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsNumber() @Min(1) adults?: number;
  @IsOptional() @IsNumber() @Min(0) children?: number;
  @IsOptional() @IsNumber() @Min(0) infants?: number;
  @IsOptional() @IsString() cabinClass?: string;
  @IsOptional() directOnly?: boolean;
}