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
import { IsString, IsEmail, IsOptional, IsMongoId } from 'class-validator';
>>>>>>> feature/participation-history-tracking

export class CreateUserDto {
  @IsString()
  name!: string;

<<<<<<< HEAD
  @IsString()
  matricule!: string;

  @IsString()
  telephone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsDate()
  date_embauche!: Date;

  department_id!: Types.ObjectId;

  @IsOptional()
  manager_id?: Types.ObjectId;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
=======
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  matricule?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsMongoId({ message: 'department_id must be a valid MongoDB ID' })
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
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  cvUrl?: string;
}
>>>>>>> feature/participation-history-tracking
