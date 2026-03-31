import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
    constructor(private readonly assignmentsService: AssignmentsService) { }

    @Post()
    async create(
        @Req() req: any, 
        @Body('userId') userId: string,
        @Body('activityId') activityId: string
    ) {
        return this.assignmentsService.create(userId, activityId, req.user.userId);
    }

    @Get()
    async getAssignments(@Req() req: any) {
        // Simple logic for fetching relevant assignments based on access role
        const role = req.user.role?.toLowerCase();
        if (role === 'admin' || role === 'hr') {
            return this.assignmentsService.findAll();
        } else if (role === 'manager') {
            return this.assignmentsService.findByAssigner(req.user.userId);
        } else {
            return this.assignmentsService.findByRecipient(req.user.userId);
        }
    }

    @Get('me')
    async getMyAssignments(@Req() req: any) {
        return this.assignmentsService.findByRecipient(req.user.userId);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: 'accepted' | 'rejected'
    ) {
        return this.assignmentsService.updateStatus(id, status);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.assignmentsService.remove(id);
    }
}
