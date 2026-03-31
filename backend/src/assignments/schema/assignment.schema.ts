import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'assignments' })
export class Assignment extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
    activityId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    assignedBy!: Types.ObjectId;

    @Prop({ default: 'pending', enum: ['pending', 'accepted', 'rejected'] })
    status!: string;

    @Prop({ type: Date, default: Date.now })
    assignedAt!: Date;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
