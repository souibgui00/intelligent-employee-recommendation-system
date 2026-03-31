import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schema/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<Notification>,
    ) { }

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = new this.notificationModel(createNotificationDto);
        return notification.save();
    }

    async findByRecipient(recipientId: string): Promise<Notification[]> {
        return this.notificationModel
            .find({ recipientId })
            .sort({ createdAt: -1 })
            .exec();
    }

    async markAsRead(id: string): Promise<Notification | null> {
        return this.notificationModel
            .findByIdAndUpdate(id, { read: true }, { new: true })
            .exec();
    }

    async markAllAsRead(recipientId: string): Promise<any> {
        return this.notificationModel
            .updateMany({ recipientId, read: false }, { read: true })
            .exec();
    }

    async remove(id: string): Promise<any> {
        return this.notificationModel.findByIdAndDelete(id).exec();
    }
}
