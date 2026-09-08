import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AskChatbotDto {
  @IsString() @MinLength(1) @MaxLength(1000) message!: string;
  @IsOptional() @IsString() conversationId?: string;
  @IsOptional() @IsObject() userInfo?: Record<string, unknown>;
}