import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateServiceRequestDto {
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsObject()
  formData: Record<string, unknown>;

  @IsOptional()
  @IsString()
  packageId?: string;
}
