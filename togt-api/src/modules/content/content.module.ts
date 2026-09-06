import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [PackagesModule],
  controllers: [ContentController],
})
export class ContentModule {}
