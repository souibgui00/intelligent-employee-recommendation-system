import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipationsService } from './participations.service';
import { ParticipationsController } from './participations.controller';
import { Participation, ParticipationSchema } from './schema/participation.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Participation.name, schema: ParticipationSchema },
        ]),
        ActivitiesModule,
    ],
    controllers: [ParticipationsController],
    providers: [ParticipationsService],
    exports: [ParticipationsService],
})
export class ParticipationsModule { }
