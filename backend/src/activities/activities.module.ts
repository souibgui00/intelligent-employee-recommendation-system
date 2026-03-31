import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity, ActivitySchema } from './schema/activity.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Activity.name, schema: ActivitySchema }]),
        UsersModule,
        NotificationsModule,
    ],
    controllers: [ActivitiesController],
    providers: [ActivitiesService],
    exports: [ActivitiesService],
})
export class ActivitiesModule { }
