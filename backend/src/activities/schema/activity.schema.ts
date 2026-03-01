import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'activities' })
export class Activity extends Document {
    @Prop({ required: true })
    title!: string;

    @Prop({ required: true })
    description!: string;

    @Prop({ required: true, enum: ['training', 'workshop', 'mentoring', 'webinar'] })
    type!: string;

    @Prop({ required: true })
    date!: string;

    @Prop({ required: true })
    duration!: string;

    @Prop({ default: 0 })
    enrolledCount!: number;

    @Prop({ default: 20 })
    capacity!: number;

    @Prop({ default: 'open', enum: ['open', 'closed', 'completed'] })
    status!: string;

    /** Approval workflow: pending_approval → approved | rejected */
    @Prop({ default: 'pending_approval', enum: ['pending_approval', 'approved', 'rejected'] })
    workflowStatus!: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    approvedBy?: Types.ObjectId;

    @Prop()
    approvedAt?: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    rejectedBy?: Types.ObjectId;

    @Prop()
    rejectedAt?: Date;

    @Prop()
    rejectionReason?: string;

    @Prop([String])
    skillsCovered!: string[];

    @Prop({ default: 'beginner', enum: ['beginner', 'intermediate', 'advanced'] })
    level!: string;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
