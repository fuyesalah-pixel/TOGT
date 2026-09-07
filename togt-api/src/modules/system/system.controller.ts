import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateMaintenanceDto, UpsertSystemKeyDto } from './dto/system-key.dto';
import { SystemService } from './system.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('system')
export class SystemController {
  constructor(private readonly system: SystemService) {}
  @Get('health') health(@CurrentUser() user: User) { return this.system.health(user); }
  @Get('metrics') metrics(@CurrentUser() user: User) { return this.system.metrics(user); }
  @Get('services') services(@CurrentUser() user: User) { return this.system.services(user); }
  @Get('logs') logs(@CurrentUser() user: User, @Query('level') level?: string, @Query('search') search?: string) { return this.system.logs(user, level, search); }
  @Get('backups') backups(@CurrentUser() user: User) { return this.system.backups(user); }
  @Post('backup') backup(@CurrentUser() user: User) { return this.system.backup(user); }
  @Get('api-keys') keys(@CurrentUser() user: User) { return this.system.providers(user); }
  @Post('api-keys') upsert(@Body() dto: UpsertSystemKeyDto, @CurrentUser() user: User) { return this.system.upsertProvider(dto, user); }
  @Delete('api-keys/:provider') remove(@Param('provider') provider: string, @CurrentUser() user: User) { return this.system.deleteProvider(provider, user); }
  @Post('api-keys/:provider/test') test(@Param('provider') provider: string, @CurrentUser() user: User) { return this.system.testProvider(provider, user); }
  @Get('migrations') migrations(@CurrentUser() user: User) { return this.system.migrations(user); }
  @Post('migrate') migrate(@CurrentUser() user: User) { return this.system.migrate(user); }
  @Get('audit-logs') auditLogs(@CurrentUser() user: User) { return this.system.auditLogs(user); }
  @Get('maintenance') maintenance(@CurrentUser() user: User) { return this.system.maintenance(user); }
  @Public() @Get('maintenance/public') publicMaintenance() { return this.system.publicMaintenance(); }
  @Post('maintenance') setMaintenance(@Body() dto: UpdateMaintenanceDto, @CurrentUser() user: User) { return this.system.setMaintenance(dto, user); }
  @Get('version') version(@CurrentUser() user: User) { return this.system.version(user); }
}
