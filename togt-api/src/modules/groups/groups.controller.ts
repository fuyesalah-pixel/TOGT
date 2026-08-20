import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AssignmentDto } from './dto/assignment.dto';
import { LocationDto } from './dto/location.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  @Roles(Role.WORKER, Role.ADMIN, Role.GUIDE, Role.CUSTOMER)
  findAll(@CurrentUser() user: User) {
    return this.groups.findAll(user);
  }

  @Post()
  @Roles(Role.WORKER, Role.ADMIN)
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: User) {
    return this.groups.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.WORKER, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groups.update(id, dto);
  }

  @Patch(':id/toggle-hidden')
  @Roles(Role.ADMIN)
  toggleHidden(@Param('id') id: string, @Body('isHidden') isHidden: boolean) {
    return this.groups.toggleHidden(id, Boolean(isHidden));
  }

  @Post(':id/members')
  @Roles(Role.WORKER, Role.ADMIN)
  addMembers(@Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.groups.addMembers(id, dto);
  }

  @Delete(':id/members/:userId')
  @Roles(Role.WORKER, Role.ADMIN)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) { return this.groups.removeMember(id, userId); }

  @Post(':id/alert')
  @Roles(Role.ADMIN)
  alertGroup(@Param('id') id: string, @Body() body: { type: 'URGENT' | 'INFO' | 'WARNING'; message: string }, @CurrentUser() user: User) { return this.groups.alertGroup(id, user, body.type, body.message); }

  @Post(':id/location')
  updateLocation(@Param('id') id: string, @Body() dto: LocationDto, @CurrentUser() user: User) { return this.groups.updateLocation(id, user, dto); }

  @Get(':id/location')
  @Roles(Role.WORKER, Role.ADMIN, Role.GUIDE, Role.CUSTOMER)
  getGroupLocation(@Param('id') id: string) { return this.groups.getGroupLocation(id); }

  @Get(':id/locations')
  @Roles(Role.WORKER, Role.ADMIN, Role.GUIDE)
  getLocations(@Param('id') id: string) { return this.groups.getLocations(id); }

  @Patch(':id/assignment')
  @Roles(Role.GUIDE)
  updateAssignment(@Param('id') id: string, @Body() dto: AssignmentDto, @CurrentUser() user: User) {
    return this.groups.updateAssignment(id, user, dto.status);
  }

  @Get(':id/plan')
  @Roles(Role.WORKER, Role.ADMIN, Role.GUIDE)
  getPlan(@Param('id') id: string) { return this.groups.getPlan(id); }

  @Post(':id/plan')
  @Roles(Role.WORKER, Role.ADMIN)
  createPlanStep(@Param('id') id: string, @Body() body: { title: string; estimatedAt?: string }) { return this.groups.createPlanStep(id, body); }

  @Patch(':id/plan/:stepId')
  @Roles(Role.WORKER, Role.ADMIN, Role.GUIDE)
  updatePlanStep(@Param('id') id: string, @Param('stepId') stepId: string, @Body() body: { status?: string; notes?: string }, @CurrentUser() user: User) { return this.groups.updatePlanStep(id, stepId, body, user); }

  @Patch(':id/plan/:stepId/confirmation')
  @Roles(Role.GUIDE)
  confirmPlan(@Param('id') id: string, @Param('stepId') stepId: string, @Body() body: { status: 'CONFIRMED' | 'REJECTED'; reason?: string }, @CurrentUser() user: User) {
    return this.groups.updatePlanConfirmation(id, stepId, user, body);
  }
}
