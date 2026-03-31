import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Participation } from './schema/participation.schema';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ParticipationsService {
    constructor(
        @InjectModel(Participation.name) private participationModel: Model<Participation>,
        private activitiesService: ActivitiesService
    ) { }

    async create(userId: string, activityId: string): Promise<Participation> {
        const existing = await this.participationModel.findOne({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId)
        });
        if (existing) return existing;

        // Perform capacity check and increment counter first
        // If this fails (BadRequestException / NotFoundException), it will bubble up
        await this.activitiesService.enroll(activityId);

        const participation = new this.participationModel({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId),
        });
        
        try {
          return await participation.save();
        } catch (error) {
          // If saving fails, roll back the counter
          await this.activitiesService.unenroll(activityId);
          throw error;
        }
    }

    async findAll(): Promise<Participation[]> {
        return this.participationModel.find()
            .populate('activityId')
            .exec();
    }

    async findByUser(userId: string): Promise<Participation[]> {
        return this.participationModel.find({ userId: new Types.ObjectId(userId) })
            .populate('activityId')
            .exec();
    }

    async updateProgress(userId: string, activityId: string, progress: number): Promise<Participation> {
        const status = progress === 100 ? 'completed' : progress === 0 ? 'started' : 'in_progress';
        const participation = await this.participationModel.findOneAndUpdate(
            {
                userId: new Types.ObjectId(userId),
                activityId: new Types.ObjectId(activityId)
            },
            { progress, status, lastUpdated: new Date() },
            { new: true }
        );
        if (!participation) throw new NotFoundException('Participation record not found');
        return participation;
    }

    async remove(userId: string, activityId: string): Promise<void> {
        const result = await this.participationModel.deleteOne({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId)
        });
        if (result.deletedCount > 0) {
            await this.activitiesService.unenroll(activityId);
        }
    }
}
