import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Evaluation } from './schema/evaluation.schema';

@Injectable()
export class EvaluationsService {
    constructor(
        @InjectModel(Evaluation.name) private evaluationModel: Model<Evaluation>
    ) { }

    async create(data: any): Promise<Evaluation> {
        const evaluation = new this.evaluationModel({
            ...data,
            employeeId: new Types.ObjectId(data.employeeId),
            skillId: new Types.ObjectId(data.skillId),
            managerId: new Types.ObjectId(data.managerId),
        });
        return await evaluation.save();
    }

    async findAll(): Promise<Evaluation[]> {
        return this.evaluationModel.find()
            .populate('employeeId', '-password')
            .populate('skillId')
            .populate('managerId', '-password')
            .exec();
    }

    async findByEmployee(employeeId: string): Promise<Evaluation[]> {
        return this.evaluationModel.find({ employeeId: new Types.ObjectId(employeeId) })
            .populate('skillId')
            .populate('managerId', '-password')
            .exec();
    }

    async findByManager(managerId: string): Promise<Evaluation[]> {
        return this.evaluationModel.find({ managerId: new Types.ObjectId(managerId) })
            .populate('employeeId', '-password')
            .populate('skillId')
            .exec();
    }

    async update(id: string, data: any): Promise<Evaluation> {
        const evaluation = await this.evaluationModel.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true }
        );
        if (!evaluation) throw new NotFoundException('Evaluation not found');
        return evaluation;
    }

    async remove(id: string): Promise<void> {
        await this.evaluationModel.findByIdAndDelete(id).exec();
    }
}
