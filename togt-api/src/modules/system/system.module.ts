import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { ChatModule } from '../chat/chat.module';

@Module({ imports: [ChatModule], controllers: [SystemController], providers: [SystemService], exports: [SystemService] })
export class SystemModule {}
