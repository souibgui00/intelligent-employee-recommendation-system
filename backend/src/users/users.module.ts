import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schema/user.schema';
<<<<<<< HEAD
=======
import { CommonModule } from '../common/common.module';
import { SkillsModule } from '../skills/skills.module';
>>>>>>> feature/participation-history-tracking

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
<<<<<<< HEAD
=======
    CommonModule,
    SkillsModule,
>>>>>>> feature/participation-history-tracking
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }

