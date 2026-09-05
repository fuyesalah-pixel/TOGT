import { Module } from '@nestjs/common';
import { CallRecordsController } from './call-records.controller';
import { CallRecordsService } from './call-records.service';

@Module({
  controllers: [CallRecordsController],
  providers: [CallRecordsService],
})
export class CallRecordsModule {}