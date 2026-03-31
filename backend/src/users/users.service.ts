import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { EmailService } from '../common/services/email.service';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private emailService: EmailService,
  ) { }

  private generateMatricule(role: string): string {
    const year = new Date().getFullYear();
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const normalizedRole = (role || 'EMPLOYEE').toUpperCase();

    let prefix = 'EMP';
    if (normalizedRole === 'ADMIN') prefix = 'ADM';
    else if (normalizedRole === 'HR') prefix = 'HR';
    else if (normalizedRole === 'MANAGER') prefix = 'MGR';

    return `${prefix}-${year}-${randomId}`;
  }

  async create(data: any) {
    // Generate matricule based on role if not provided
    if (!data.matricule) {
      data.matricule = this.generateMatricule(data.role);
    }

    let rawPassword: string | null = null;
    const isGoogleUser = !!data.isGoogleUser;

    if (!isGoogleUser) {
      // Only generate/hash a password for non-Google users
      rawPassword = data.password || Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(rawPassword!, salt);
    } else {
      // Google users get a random unusable password — they log in via OAuth only
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(Math.random().toString(36).slice(-16), salt);
    }

    // Set role to enum if provided as string
    if (typeof data.role === 'string') {
      data.role = data.role.toUpperCase() as Role;
    }

    // Clean up empty optional fields that might fail MongoId casting
    if (data.department_id === '' || data.department_id === 'none') data.department_id = null;
    if (data.manager_id === '' || data.manager_id === 'none') data.manager_id = null;

    let savedUser;
    try {
      const user = new this.userModel(data);
      savedUser = await user.save();
    } catch (error: any) {
      console.error('[UsersService.create] Error saving user:', error);
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }

    // Send credentials email only for manually created (non-Google) users
    if (!isGoogleUser && rawPassword) {
      this.emailService.sendNewUserCredentials(
        data.email,
        data.name,
        rawPassword,
        data.matricule,
      ).catch(err => {
        console.error('[UsersService] Failed to send credentials email:', err);
      });
    }

    const userObj = savedUser.toObject();
    const { password, ...userWithoutPassword } = userObj as any;
    return {
      ...userWithoutPassword,
      ...(rawPassword ? { generatedPassword: rawPassword } : {}),
    };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    }).populate('skills.skillId');
  }

  async findAll() {
    try {
      return await this.userModel
        .find()
        .populate('department_id', 'name code')
        .populate('skills.skillId')
        .select('-password');
    } catch (error: any) {
      console.warn('[UsersService] Population failed in findAll, falling back:', error.message);
      return this.userModel.find().select('-password');
    }
  }

  async findManagers() {
    return this.userModel.find({ role: { $regex: /^manager$/i } }).select('-password').exec();
  }

  async findOne(id: string) {
    let user;
    try {
      user = await this.userModel
        .findById(id)
        .populate('department_id', 'name code')
        .populate('skills.skillId')
        .select('-password');
    } catch (error: any) {
      console.warn(`[UsersService] Population failed for user ${id}:`, error.message);
      user = await this.userModel.findById(id).select('-password');
    }

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    const updateData: any = { ...data };

    // Ensure role and matricule are never set through the generic update path
    delete updateData.role;
    delete updateData.matricule;

    if (updateData.department_id === '' || updateData.department_id === 'none') updateData.department_id = null;
    if (updateData.manager_id === '' || updateData.manager_id === 'none') updateData.manager_id = null;

    // Hash password if it's being updated
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    let user;
    try {
      user = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('department_id', 'name code')
        .populate('skills.skillId')
        .select('-password');
    } catch (error: any) {
      console.warn(`[UsersService] Update population failed for user ${id}:`, error.message);
      user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    }

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async updateRole(id: string, role: Role) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    ).populate('department_id', 'name code')
     .populate('skills.skillId')
     .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async saveResetToken(userId: string, token: string, expires: Date) {
    return this.userModel.findByIdAndUpdate(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async findByResetToken(token: string) {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  async updatePassword(userId: string, newPassword: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    return { message: 'Password changed successfully' };
  }

  // ─── Skill management ────────────────────────────────────────────────────────

  async addSkillToUser(userId: string, skillData: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Prevent duplicate skill entries for the same skillId
    const existing = user.skills?.find(
      (s: any) => s.skillId?.toString() === skillData.skillId?.toString(),
    );
    if (existing) throw new BadRequestException('Skill already assigned to this user');

    const newSkill = {
      skillId: new Types.ObjectId(skillData.skillId),
      level: skillData.level || 'beginner',
      score: skillData.score ?? 0,
      auto_eval: skillData.auto_eval ?? 0,
      hierarchie_eval: skillData.hierarchie_eval ?? 0,
      progression: 0,
      etat: 'draft',
      lastUpdated: new Date(),
    };

    user.skills = [...(user.skills || []), newSkill];
    await user.save();

    return this.findOne(userId);
  }

  async updateUserSkill(userId: string, skillId: string, updateData: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const skillIndex = user.skills?.findIndex(
      (s: any) => s.skillId?.toString() === skillId,
    );
    if (skillIndex === -1 || skillIndex === undefined) {
      throw new NotFoundException('Skill not found on this user');
    }

    const skill = user.skills[skillIndex];
    user.skills[skillIndex] = {
      ...skill,
      ...updateData,
      skillId: skill.skillId, // preserve original skillId
      lastUpdated: new Date(),
    };

    user.markModified('skills');
    await user.save();

    return this.findOne(userId);
  }

  async removeSkillFromUser(userId: string, skillId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.skills = (user.skills || []).filter(
      (s: any) => s.skillId?.toString() !== skillId,
    );
    user.markModified('skills');
    await user.save();

    return this.findOne(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  async remove(id: string) {

    return this.userModel.findByIdAndDelete(id);
  }
}
