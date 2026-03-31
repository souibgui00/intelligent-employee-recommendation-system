import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'evaluations' })
export class Evaluation extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    employeeId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Skill', required: true })
    skillId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    managerId!: Types.ObjectId;

    @Prop({ min: 0, max: 100 })
    score?: number;

    @Prop({ default: 'pending', enum: ['pending', 'completed'] })
    status!: string;

    @Prop({ type: String })
    comment?: string;

    @Prop({ type: Date, default: Date.now })
    evaluatedAt!: Date;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
