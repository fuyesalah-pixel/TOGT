import { Module } from '@nestjs/common';
import { CallRecordsController } from './call-records.controller';
import { CallRecordsService } from './call-records.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [CallRecordsController],
  providers: [CallRecordsService],
})
export class CallRecordsModule {}