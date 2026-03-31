import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

<<<<<<< HEAD
@Schema({ timestamps: true })
=======
@Schema({ timestamps: true, collection: 'users' })
>>>>>>> feature/participation-history-tracking
export class User extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
<<<<<<< HEAD
  matricule!: string;

  @Prop({ required: true })
  telephone!: string;

  @Prop({ required: true, unique: true })
=======
>>>>>>> feature/participation-history-tracking
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
<<<<<<< HEAD
  date_embauche!: Date;

  @Prop({ type: Types.ObjectId, required: true })
  department_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  manager_id!: Types.ObjectId;

  @Prop({ enum: Role, default: Role.EMPLOYEE })
  role!: Role;
=======
  matricule!: string;

  @Prop()
  telephone?: string;

  @Prop()
  date_embauche?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  department_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager_id?: Types.ObjectId;
>>>>>>> feature/participation-history-tracking

  @Prop({ default: 'active' })
  status!: string;

  @Prop({ default: false })
  en_ligne!: boolean;
<<<<<<< HEAD
=======

  @Prop({ enum: Role, default: Role.EMPLOYEE })
  role!: Role;

  @Prop()
  avatar?: string;

  @Prop()
  position?: string;

  @Prop()
  jobDescription?: string;

  @Prop({ type: Number, default: 0 })
  yearsOfExperience?: number;

  @Prop()
  location?: string;

  @Prop({ default: false })
  isGoogleUser?: boolean;

  @Prop()
  facePicture?: string;

  @Prop({ default: false })
  isFaceIdEnabled?: boolean;

  @Prop()
  cvUrl?: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop([
    {
      skillId: { type: Types.ObjectId, ref: 'Skill' },
      level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
      score: { type: Number, default: 0, min: 0, max: 100 },
      auto_eval: { type: Number, default: 0, min: 0, max: 100 },
      hierarchie_eval: { type: Number, default: 0, min: 0, max: 100 },
      progression: { type: Number, default: 0 },
      etat: { type: String, enum: ['draft', 'submitted', 'validated'], default: 'draft' },
      lastUpdated: { type: Date, default: Date.now },
    },
  ])
  skills!: any[];
>>>>>>> feature/participation-history-tracking
}

export const UserSchema = SchemaFactory.createForClass(User);

<<<<<<< HEAD
=======
UserSchema.post('findOneAndDelete', async function (doc: any) {
    if (doc) {
        try {
            const db = this.model.db;
            await db.model('Participation').deleteMany({ userId: doc._id });
            await db.model('Assignment').deleteMany({ $or: [{ userId: doc._id }, { assignedBy: doc._id }] });
            await db.model('Evaluation').deleteMany({ $or: [{ employeeId: doc._id }, { managerId: doc._id }] });
            await db.model('Notification').deleteMany({ recipientId: doc._id });
            console.log(`[User Cleanup] Removed related records for deleted user: ${doc._id}`);
        } catch (error) {
            console.error('[User Cleanup] Failed to run cascading deletes:', error);
        }
    }
});
>>>>>>> feature/participation-history-tracking
