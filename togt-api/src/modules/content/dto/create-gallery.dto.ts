import { ArrayMaxSize, IsArray, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  @Length(2, 160)
  title: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  images: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;
}
