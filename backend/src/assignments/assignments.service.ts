import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment } from './schema/assignment.schema';

import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class AssignmentsService {
    constructor(
        @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
        private activitiesService: ActivitiesService
    ) { }

    async create(userId: string, activityId: string, assignedBy: string): Promise<Assignment> {
        const activity = await this.activitiesService.findOne(activityId);
        if (!activity) {
            throw new NotFoundException(`Activity with ID ${activityId} not found`);
        }
        if (activity.workflowStatus !== 'approved') {
            throw new BadRequestException('Cannot assign an unapproved activity');
        }

        const existing = await this.assignmentModel.findOne({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId)
        });
        if (existing) return existing;

        const assignment = new this.assignmentModel({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId),
            assignedBy: new Types.ObjectId(assignedBy),
        });
        return await assignment.save();
    }

    async findAll(): Promise<Assignment[]> {
        return this.assignmentModel.find()
            .populate('userId', '-password')
            .populate('activityId')
            .populate('assignedBy', '-password')
            .exec();
    }

    async findByRecipient(userId: string): Promise<Assignment[]> {
        return this.assignmentModel.find({ userId: new Types.ObjectId(userId) })
            .populate('activityId')
            .populate('assignedBy', '-password')
            .exec();
    }

    async findByAssigner(assignedBy: string): Promise<Assignment[]> {
        return this.assignmentModel.find({ assignedBy: new Types.ObjectId(assignedBy) })
            .populate('userId', '-password')
            .populate('activityId')
            .exec();
    }

    async updateStatus(id: string, status: string): Promise<Assignment> {
        const assignment = await this.assignmentModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        if (!assignment) throw new NotFoundException('Assignment not found');
        return assignment;
    }

    async remove(id: string): Promise<void> {
        await this.assignmentModel.findByIdAndDelete(id).exec();
    }
}
