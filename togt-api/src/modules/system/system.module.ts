import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { ChatModule } from '../chat/chat.module';
import { CredentialService } from './credential.service';

@Module({ imports: [ChatModule], controllers: [SystemController], providers: [SystemService, CredentialService], exports: [SystemService, CredentialService] })
export class SystemModule {}
