import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class InitializePaymentDto {
  @IsUUID() requestId!: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsOptional() @IsString() currency?: string;
}
