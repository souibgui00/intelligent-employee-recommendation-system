import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Patch, Req } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Roles(Role.HR, Role.ADMIN)
    @Post()
    create(@Body() createActivityDto: CreateActivityDto, @Req() req: any) {
        return this.activitiesService.create(createActivityDto, req.user.userId);
    }

    @Get()
    findAll() {
        return this.activitiesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.activitiesService.findOne(id);
    }

    @Roles(Role.HR, Role.ADMIN)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
        return this.activitiesService.update(id, updateActivityDto);
    }

    @Roles(Role.HR, Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.activitiesService.remove(id);
    }

    @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE)
    @Patch(':id/enroll')
    enroll(@Param('id') id: string) {
        return this.activitiesService.enroll(id);
    }

    @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE)
    @Patch(':id/unenroll')
    unenroll(@Param('id') id: string) {
        return this.activitiesService.unenroll(id);
    }

    @Roles(Role.MANAGER, Role.HR, Role.ADMIN)
    @Get('pending')
    findPending() {
        return this.activitiesService.findPending();
    }

    @Roles(Role.MANAGER, Role.HR, Role.ADMIN)
    @Patch(':id/approve')
    approve(@Param('id') id: string, @Req() req: any) {
        return this.activitiesService.approve(id, req.user.userId);
    }

    @Roles(Role.MANAGER, Role.HR, Role.ADMIN)
    @Patch(':id/reject')
    reject(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
        return this.activitiesService.reject(id, req.user.userId, reason);
    }
}
