import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Department } from './schema/department.schema';
import { User } from '../users/schema/user.schema';

const mockDept = { _id: 'dept-1', name: 'Engineering', code: 'ENG-42', manager_id: null };

const deptExecMock = jest.fn();
const mockDeptModel: any = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

const mockUserModel: any = {
  countDocuments: jest.fn(),
};

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    deptExecMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: getModelToken(Department.name), useValue: mockDeptModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a department when name and code are unique', async () => {
      mockDeptModel.findOne.mockResolvedValue(null);
      mockDeptModel.create.mockResolvedValue(mockDept);

      const result = await service.create({ name: 'Engineering', code: 'ENG-42' } as any);
      expect(result).toEqual(mockDept);
    });

    it('should auto-generate code when not provided', async () => {
      mockDeptModel.findOne.mockResolvedValue(null);
      mockDeptModel.create.mockResolvedValue(mockDept);

      const dto: any = { name: 'Engineering' };
      await service.create(dto);
      expect(dto.code).toBeDefined();
      expect(typeof dto.code).toBe('string');
    });

    it('should throw ConflictException when department name already exists', async () => {
      mockDeptModel.findOne.mockResolvedValue({ ...mockDept, name: 'Engineering' });

      await expect(service.create({ name: 'Engineering', code: 'NEW-11' } as any))
        .rejects.toThrow(ConflictException);
    });

    it('should retry code generation when auto-code conflicts but name is different', async () => {
      mockDeptModel.findOne.mockResolvedValue({ name: 'OtherDept', code: 'ENG-99' });
      mockDeptModel.create.mockResolvedValue(mockDept);

      const dto: any = { name: 'Engineering' };
      const result = await service.create(dto);
      expect(result).toEqual(mockDept);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all departments', async () => {
      mockDeptModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockDept]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockDept]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return department when found', async () => {
      mockDeptModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDept),
      });

      const result = await service.findOne('dept-1');
      expect(result).toEqual(mockDept);
    });

    it('should throw NotFoundException when department not found', async () => {
      mockDeptModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update department successfully', async () => {
      const updated = { ...mockDept, name: 'Tech' };
      mockDeptModel.findOne.mockResolvedValue(null);
      mockDeptModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('dept-1', { name: 'Tech' } as any);
      expect(result).toEqual(updated);
    });

    it('should throw ConflictException when name is already in use by another dept', async () => {
      mockDeptModel.findOne.mockResolvedValue({ _id: 'dept-2', name: 'Tech' });

      await expect(service.update('dept-1', { name: 'Tech' } as any))
        .rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when dept to update does not exist', async () => {
      mockDeptModel.findOne.mockResolvedValue(null);
      mockDeptModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistent', { name: 'Tech' } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should skip conflict check when no name or code in dto', async () => {
      const updated = { ...mockDept };
      mockDeptModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update('dept-1', { description: 'updated' } as any);
      expect(result).toEqual(updated);
      expect(mockDeptModel.findOne).not.toHaveBeenCalled();
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete department when no users are assigned', async () => {
      mockUserModel.countDocuments.mockResolvedValue(0);
      mockDeptModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDept),
      });

      const result = await service.remove('dept-1');
      expect(result).toEqual(mockDept);
    });

    it('should throw BadRequestException when users are assigned to dept', async () => {
      mockUserModel.countDocuments.mockResolvedValue(3);

      await expect(service.remove('dept-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when department to delete does not exist', async () => {
      mockUserModel.countDocuments.mockResolvedValue(0);
      mockDeptModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
