import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdateCallRecordDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() teamNumber?: string;
  @IsOptional() @IsString() fatherName?: string;
  @IsOptional() @IsString() passportNumber?: string;
  @IsOptional() @IsString() passportFileUrl?: string;
  @IsOptional() @IsString() otherFileUrl?: string;
  @IsOptional() @IsString() idImageUrl?: string;
  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsString() packageTitle?: string;
  @IsOptional() @IsString() tripType?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsDateString() departureDate?: string;
  @IsOptional() @IsString() tripDuration?: string;
  @IsOptional() @IsInt() @Min(0) passengerCount?: number;
  @IsOptional() @IsNumber() @Min(0) totalAmount?: number;
  @IsOptional() @IsNumber() @Min(0) paidAmount?: number;
  @IsOptional() @IsNumber() @Min(0) remainingAmount?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional() @IsString() flightNumber?: string;
  @IsOptional() @IsDateString() flightDate?: string;
  @IsOptional() @IsString() flightBookingStatus?: string;
  @IsOptional() @IsString() airline?: string;
  @IsOptional() @IsString() additionalInfo?: string;
}
