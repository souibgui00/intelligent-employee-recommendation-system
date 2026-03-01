import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department } from './schema/department.schema';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectModel(Department.name)
        private departmentModel: Model<Department>,
    ) { }

    async findAll() {
        return this.departmentModel.find().exec();
    }

    async create(name: string) {
        const dep = new this.departmentModel({ name });
        return dep.save();
    }
}
