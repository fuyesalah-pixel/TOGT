import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum SystemProvider {
  OPENROUTER = 'OPENROUTER',
  OPENAI = 'OPENAI',
  GEMINI = 'GEMINI',
  DUFFEL = 'DUFFEL',
  CHAPA = 'CHAPA',
  RESEND = 'RESEND',
  SMS_ETHIOPIA = 'SMS_ETHIOPIA',
  MAPBOX = 'MAPBOX',
  R2 = 'R2',
  TELEGRAM = 'TELEGRAM',
  FIREBASE = 'FIREBASE',
}

export class UpsertSystemKeyDto {
  @IsEnum(SystemProvider) provider!: SystemProvider;
  @IsString() @MinLength(1) secret!: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

export class UpdateMaintenanceDto {
  @IsBoolean() enabled!: boolean;
  @IsOptional() @IsString() message?: string;
  @IsOptional() startsAt?: string;
  @IsOptional() endsAt?: string;
}
