import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { UploadsService } from './uploads.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** Generic single-file upload. Multipart field name: "file". */
  @Post()
  @Roles(Role.WORKER, Role.ADMIN, Role.CUSTOMER, Role.GUIDE)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'misc',
  ) {
    const url = await this.uploads.upload(file, folder);
    return { url };
  }
}
