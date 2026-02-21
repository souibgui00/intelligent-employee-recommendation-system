import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Types } from 'mongoose';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  matricule?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsDate()
  date_embauche?: Date;

  @IsOptional()
  department_id?: Types.ObjectId;

  @IsOptional()
  manager_id?: Types.ObjectId;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  en_ligne?: boolean;
}

