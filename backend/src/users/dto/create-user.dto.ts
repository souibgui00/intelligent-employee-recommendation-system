import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateUserDto {
  @IsString()
  name!: string;

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
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  en_ligne?: boolean;
}

