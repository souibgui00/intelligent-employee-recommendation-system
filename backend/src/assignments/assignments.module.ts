import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment, AssignmentSchema } from './schema/assignment.schema';

import { ActivitiesModule } from '../activities/activities.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Assignment.name, schema: AssignmentSchema }]),
        ActivitiesModule
    ],
    controllers: [AssignmentsController],
    providers: [AssignmentsService],
    exports: [AssignmentsService]
})
export class AssignmentsModule {}
