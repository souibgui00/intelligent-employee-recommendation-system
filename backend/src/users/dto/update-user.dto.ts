<<<<<<< HEAD
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
=======
import { IsString, IsEmail, IsOptional, IsMongoId, IsBoolean, IsNumber } from 'class-validator';
>>>>>>> feature/participation-history-tracking

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
<<<<<<< HEAD
  @IsString()
  matricule?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
=======
>>>>>>> feature/participation-history-tracking
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
<<<<<<< HEAD
  @IsDate()
  date_embauche?: Date;

  @IsOptional()
  department_id?: Types.ObjectId;

  @IsOptional()
  manager_id?: Types.ObjectId;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
=======
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  date_embauche?: string;
>>>>>>> feature/participation-history-tracking

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
<<<<<<< HEAD
  @IsBoolean()
  en_ligne?: boolean;
}

=======
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  @IsMongoId({ message: 'manager_id must be a valid MongoDB ID' })
  manager_id?: string;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsBoolean()
  en_ligne?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  cvUrl?: string;
}
>>>>>>> feature/participation-history-tracking
