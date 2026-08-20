import { IsBoolean, IsInt, IsOptional, IsString, Length, Min, MinLength } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @Length(3, 300)
  question: string;

  @IsString()
  @MinLength(5)
  answer: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
