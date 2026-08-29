import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role, User } from '@prisma/client';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryServiceRequestsDto } from './dto/query-service-requests.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequests: ServiceRequestsService) {}

  @Get()
  findAll(@Query() query: QueryServiceRequestsDto, @CurrentUser() user: User) {
    return this.serviceRequests.findAll(query, user);
  }

  @Post()
  create(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: User) {
    return this.serviceRequests.create(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.serviceRequests.findOne(id, user);
  }

  @Patch(':id/amount')
  setAmount(@Param('id') id: string, @Body('amount') amount: number, @CurrentUser() user: User) {
    return this.serviceRequests.setAmount(id, amount, user);
  }

  @Patch(':id/status')
  @Roles(Role.WORKER, Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: User) {
    return this.serviceRequests.updateStatus(id, dto, user);
  }

  @Post(':id/status')
  @Roles(Role.WORKER, Role.ADMIN)
  updateStatusPost(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: User) {
    return this.serviceRequests.updateStatus(id, dto, user);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @CurrentUser() user: User) {
    return this.serviceRequests.getHistory(id, user);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  addDocument(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    return this.serviceRequests.addDocument(id, file, user);
  }
}
