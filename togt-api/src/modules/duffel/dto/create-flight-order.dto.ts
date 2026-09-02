import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEmail, IsNumber, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';

export class FlightPassengerDto {
  @IsOptional() @IsString() passengerId?: string;
  @IsString() @MinLength(1) firstName!: string;
  @IsString() @MinLength(1) lastName!: string;
  @IsDateString() dob!: string;
  @IsOptional() @IsString() gender?: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(7) phone!: string;
  @IsOptional() @IsString() passportNumber?: string;
  @IsOptional() @IsString() passportExpiry?: string;
  @IsOptional() @IsString() nationality?: string;
}

export class CreateFlightOrderDto {
  @IsString() @MinLength(1) offerId!: string;
  @IsOptional() @IsString() offerRequestId?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => FlightPassengerDto)
  passengers!: FlightPassengerDto[];
  @IsOptional() @IsArray() seatSelection?: Array<{ designator: string; passengerId: string; serviceId?: string }>;
  @IsOptional() @IsArray() services?: Array<{ id: string; quantity?: number; passengerId?: string }>;
  @IsOptional() @IsNumber() @Min(0) seatAmount?: number;
  @IsOptional() @IsNumber() @Min(0) ancillaryAmount?: number;
  @IsOptional() @IsString() customerCurrency?: string;
}
