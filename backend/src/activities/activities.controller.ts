import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Patch, Req, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto, RejectActivityDto } from './dto/activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Request } from 'express';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Roles(Role.HR, Role.ADMIN)
    @Post()
    create(@Body() createActivityDto: CreateActivityDto, @Req() req: Request) {
        const userId = (req as any).user?.userId;
        return this.activitiesService.create(createActivityDto, userId);
    }

    @Get('pending')
    @Roles(Role.MANAGER, Role.ADMIN)
    findPendingApproval() {
        return this.activitiesService.findPendingApproval();
    }

    @Get()
    findAll(@Query('workflowStatus') workflowStatus?: string) {
        return this.activitiesService.findAll(workflowStatus);
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

    @Roles(Role.MANAGER, Role.ADMIN)
    @Patch(':id/approve')
    approve(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user?.userId;
        return this.activitiesService.approve(id, userId);
    }

    @Roles(Role.MANAGER, Role.ADMIN)
    @Patch(':id/reject')
    reject(@Param('id') id: string, @Body() body: RejectActivityDto, @Req() req: Request) {
        const userId = (req as any).user?.userId;
        return this.activitiesService.reject(id, userId, body.reason);
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
}
