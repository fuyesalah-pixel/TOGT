import { Module } from '@nestjs/common';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { ChatModule } from '../chat/chat.module';
import { TranslationService } from './translation.service';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [ChatModule, SystemModule],
  controllers: [PackagesController],
  providers: [PackagesService, TranslationService],
  exports: [PackagesService, TranslationService],
})
export class PackagesModule {}
