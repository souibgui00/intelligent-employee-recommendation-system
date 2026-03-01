import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './schema/activity.schema';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectModel(Activity.name)
        private activityModel: Model<Activity>,
    ) { }

    async create(createActivityDto: CreateActivityDto, createdByUserId?: string): Promise<Activity> {
        const data = {
            ...createActivityDto,
            workflowStatus: createActivityDto.workflowStatus ?? 'pending_approval',
            createdBy: createdByUserId,
        };
        const createdActivity = new this.activityModel(data);
        return createdActivity.save();
    }

    async findAll(workflowStatus?: string): Promise<Activity[]> {
        const filter = workflowStatus ? { workflowStatus } : {};
        return this.activityModel.find(filter).populate('createdBy', 'name email').populate('approvedBy', 'name email').populate('rejectedBy', 'name email').sort({ createdAt: -1 }).exec();
    }

    async findPendingApproval(): Promise<Activity[]> {
        return this.activityModel.find({ workflowStatus: 'pending_approval' }).populate('createdBy', 'name email').exec();
    }

    async findOne(id: string): Promise<Activity | null> {
        return this.activityModel.findById(id).populate('createdBy', 'name email').populate('approvedBy', 'name email').populate('rejectedBy', 'name email').exec();
    }

    async update(id: string, updateActivityDto: UpdateActivityDto): Promise<Activity | null> {
        return this.activityModel.findByIdAndUpdate(id, updateActivityDto, { new: true }).exec();
    }

    async remove(id: string): Promise<any> {
        return this.activityModel.findByIdAndDelete(id).exec();
    }

    async approve(id: string, managerUserId: string): Promise<Activity | null> {
        const activity = await this.activityModel.findById(id).exec();
        if (!activity) return null;
        if (activity.workflowStatus !== 'pending_approval') {
            throw new BadRequestException(`Activity is not pending approval (current: ${activity.workflowStatus})`);
        }
        return this.activityModel.findByIdAndUpdate(
            id,
            {
                workflowStatus: 'approved',
                status: 'open',
                approvedBy: managerUserId,
                approvedAt: new Date(),
                rejectedBy: undefined,
                rejectedAt: undefined,
                rejectionReason: undefined,
            },
            { new: true }
        ).populate('approvedBy', 'name email').exec();
    }

    async reject(id: string, managerUserId: string, reason?: string): Promise<Activity | null> {
        const activity = await this.activityModel.findById(id).exec();
        if (!activity) return null;
        if (activity.workflowStatus !== 'pending_approval') {
            throw new BadRequestException(`Activity is not pending approval (current: ${activity.workflowStatus})`);
        }
        return this.activityModel.findByIdAndUpdate(
            id,
            {
                workflowStatus: 'rejected',
                rejectedBy: managerUserId,
                rejectedAt: new Date(),
                rejectionReason: reason ?? undefined,
                approvedBy: undefined,
                approvedAt: undefined,
            },
            { new: true }
        ).populate('rejectedBy', 'name email').exec();
    }

    async enroll(id: string): Promise<Activity | null> {
        return this.activityModel.findByIdAndUpdate(
            id,
            { $inc: { enrolledCount: 1 } },
            { new: true }
        ).exec();
    }

    async unenroll(id: string): Promise<Activity | null> {
        return this.activityModel.findByIdAndUpdate(
            id,
            { $inc: { enrolledCount: -1 } },
            { new: true }
        ).exec();
    }
}
