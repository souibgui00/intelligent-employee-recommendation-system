import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { Evaluation, EvaluationSchema } from './schema/evaluation.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Evaluation.name, schema: EvaluationSchema }])
    ],
    controllers: [EvaluationsController],
    providers: [EvaluationsService],
    exports: [EvaluationsService]
})
export class EvaluationsModule {}
