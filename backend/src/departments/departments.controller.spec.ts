import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Role } from '../common/enums/role.enum';

const mockDept = { _id: 'dept-1', name: 'Engineering', code: 'ENG-42' };

const mockDepartmentsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: DepartmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        { provide: DepartmentsService, useValue: mockDepartmentsService },
      ],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a department', async () => {
      const dto = { name: 'Engineering', code: 'ENG-42' };
      mockDepartmentsService.create.mockResolvedValue(mockDept);
      const result = await controller.create(dto as any);
      expect(result).toEqual(mockDept);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all departments', async () => {
      mockDepartmentsService.findAll.mockResolvedValue([mockDept]);
      const result = await controller.findAll();
      expect(result).toEqual([mockDept]);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should apply limit if provided', async () => {
      const depts = [mockDept, { ...mockDept, _id: 'dept-2' }];
      mockDepartmentsService.findAll.mockResolvedValue(depts);
      const result = await controller.findAll('1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockDept);
    });
  });

  describe('findOne', () => {
    it('should return a department by id', async () => {
      mockDepartmentsService.findOne.mockResolvedValue(mockDept);
      const result = await controller.findOne('dept-1');
      expect(result).toEqual(mockDept);
      expect(service.findOne).toHaveBeenCalledWith('dept-1');
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      const dto = { name: 'New Name' };
      mockDepartmentsService.update.mockResolvedValue({ ...mockDept, ...dto });
      const result = await controller.update('dept-1', dto as any);
      expect(result.name).toBe('New Name');
      expect(service.update).toHaveBeenCalledWith('dept-1', dto);
    });
  });

  describe('remove', () => {
    it('should remove a department', async () => {
      mockDepartmentsService.remove.mockResolvedValue(undefined);
      await controller.remove('dept-1');
      expect(service.remove).toHaveBeenCalledWith('dept-1');
    });
  });
});
