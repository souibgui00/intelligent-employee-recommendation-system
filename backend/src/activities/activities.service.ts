import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './schema/activity.schema';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private activityModel: Model<Activity>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async create(
    createActivityDto: CreateActivityDto,
    userId: string,
  ): Promise<Activity> {
    const createdActivity = new this.activityModel({
      ...createActivityDto,
      createdBy: userId,
      workflowStatus: 'pending_approval',
    });
    const activity = await createdActivity.save();

    // Notify manager
    try {
      const hrUser = await this.usersService.findOne(userId);

      if (hrUser) {
        let managerId = hrUser.manager_id?.toString();
        console.log(`[ActivitiesService] Creating activity. HR: ${hrUser.name}, Assigned ManagerID: ${managerId || 'None'}`);

        if (!managerId) {
          // If HR has no assigned manager, notify all managers
          const managers = await this.usersService.findManagers();
          
          console.log(`[ActivitiesService] HR has no manager. Found ${managers.length} managers to notify.`);
          
          for (const manager of managers) {
            console.log(`[ActivitiesService] Notifying manager: ${manager.name} (${manager._id})`);
            await this.notificationsService.create({
              recipientId: manager._id.toString(),
              title: 'New Activity Suggestion',
              message: `HR ${hrUser.name || 'User'} has suggested a new activity: ${activity.title}`,
              type: 'activity_created',
              metadata: { activityId: activity._id.toString() },
            });
          }
        } else {
          console.log(`[ActivitiesService] Notifying assigned manager ID: ${managerId}`);
          await this.notificationsService.create({
            recipientId: managerId,
            title: 'New Activity Suggestion',
            message: `HR ${hrUser.name || 'User'} has suggested a new activity: ${activity.title}`,
            type: 'activity_created',
            metadata: { activityId: activity._id.toString() },
          });
        }
      } else {
        console.warn(`[ActivitiesService] No HR user found for ID: ${userId}`);
      }
    } catch (err) {
      console.error('Failed to send notification for activity creation:', err);
    }

    return activity;
  }

  async findAll(): Promise<Activity[]> {
    // Removed populate('skills') because Activity schema does not define a skills relationship.
    // The frontend expects skills/skillsCovered arrays; this method returns raw activity docs.
    return this.activityModel.find().exec();
  }

  async findOne(id: string): Promise<Activity | null> {
    return this.activityModel.findById(id).exec();
  }

  async update(
    id: string,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity | null> {
    const activity = await this.activityModel.findById(id);
    if (activity && activity.workflowStatus === 'rejected') {
      return this.activityModel
        .findByIdAndUpdate(
          id,
          { ...updateActivityDto, workflowStatus: 'pending_approval' },
          { new: true },
        )
        .exec();
    }
    return this.activityModel
      .findByIdAndUpdate(id, updateActivityDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.activityModel.findByIdAndDelete(id).exec();
  }

  async enroll(id: string): Promise<Activity | null> {
    const activity = await this.activityModel.findById(id);
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    if (activity.workflowStatus !== 'approved') {
      throw new BadRequestException('Cannot enroll in a non-approved activity');
    }

    if (activity.capacity !== undefined && activity.capacity > 0) {
      if (activity.enrolledCount >= activity.capacity) {
        throw new BadRequestException('Activity is at full capacity');
      }
    }

    return this.activityModel
      .findByIdAndUpdate(
        id, 
        { $inc: { enrolledCount: 1 } }, 
        { new: true }
      )
      .exec();
  }

  async unenroll(id: string): Promise<Activity | null> {
    const activity = await this.activityModel.findById(id);
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    // Safety: don't go below 0
    const decrement = activity.enrolledCount > 0 ? -1 : 0;

    return this.activityModel
      .findByIdAndUpdate(
        id, 
        { $inc: { enrolledCount: decrement } }, 
        { new: true }
      )
      .exec();
  }

  async approve(id: string, userId: string): Promise<Activity | null> {
    const activity = await this.activityModel
      .findByIdAndUpdate(
        id,
        {
          workflowStatus: 'approved',
          approvedBy: userId,
          approvedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (activity) {
      // Notify the creator (HR)
      try {
        await this.notificationsService.create({
          recipientId: activity.createdBy,
          title: 'Activity Approved',
          message: `Your activity "${activity.title}" has been approved.`,
          type: 'activity_approved',
          metadata: { activityId: activity._id.toString() },
        });
      } catch (err) {
        console.error(
          'Failed to send notification for activity approval:',
          err,
        );
      }
    }

    return activity;
  }

  async reject(
    id: string,
    userId: string,
    reason: string,
  ): Promise<Activity | null> {
    const activity = await this.activityModel
      .findByIdAndUpdate(
        id,
        {
          workflowStatus: 'rejected',
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
        { new: true },
      )
      .exec();

    if (activity) {
      // Notify the creator (HR)
      try {
        await this.notificationsService.create({
          recipientId: activity.createdBy,
          title: 'Activity Rejected',
          message: `Your activity "${activity.title}" has been rejected. Reason: ${reason}`,
          type: 'activity_rejected',
          metadata: { activityId: activity._id.toString(), reason },
        });
      } catch (err) {
        console.error(
          'Failed to send notification for activity rejection:',
          err,
        );
      }
    }

    return activity;
  }

  async findPending(): Promise<Activity[]> {
    return this.activityModel
      .find({ workflowStatus: 'pending_approval' })
      .exec();
  }
}
