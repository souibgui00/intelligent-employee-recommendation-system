import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { User } from './schema/user.schema';
import { Role } from '../common/enums/role.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let departmentModel: any;

  const mockUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'John Doe',
    email: 'john@example.com',
    role: Role.EMPLOYEE,
    department_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    skills: [],
    save: jest.fn().mockResolvedValue(true)
  };

  const mockUserModel = {
    new: jest.fn().mockImplementation(() => mockUser),
    constructor: jest.fn().mockImplementation(() => mockUser),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exec: jest.fn()
  };

  const mockDepartmentModel = {
    findById: jest.fn(),
    findOne: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken('Department'), useValue: mockDepartmentModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
    departmentModel = module.get(getModelToken('Department'));
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('findOne', () => {
    it('should return a user if found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser)
      });
      const result = await service.findOne(mockUser._id.toString());
      expect(result.name).toBe('John Doe');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      });
      await expect(service.findOne('id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getManagerByDepartment', () => {
    it('should return the manager of a department', async () => {
      const manager = { ...mockUser, role: Role.MANAGER };
      mockUserModel.findOne.mockResolvedValue(manager);
      const result = await service.getManagerByDepartment('dept-1');
      expect(result!.role).toBe(Role.MANAGER);
    });

    it('should return null if no manager found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const result = await service.getManagerByDepartment('dept-1');
      expect(result).toBeNull();
    });
  });

  describe('addSkill', () => {
    it('should add a skill to a user', async () => {
      const user = { ...mockUser, skills: [], save: jest.fn().mockResolvedValue(true) };
      mockUserModel.findById.mockResolvedValue(user);
      
      const result = await service.addSkill(user._id.toString(), {
        skillId: 's1',
        level: 'intermediate'
      });
      expect(user.skills).toHaveLength(1);
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if skill already exists', async () => {
      const user = { 
        ...mockUser, 
        skills: [{ skillId: 's1' }] 
      };
      mockUserModel.findById.mockResolvedValue(user);
      await expect(service.addSkill('uid', { skillId: 's1' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findRawDepartmentId', () => {
    it('should return raw department ID using findOne lean', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ department_id: 'dept-raw' })
      });
      const result = await service.findRawDepartmentId('uid');
      expect(result).toBe('dept-raw');
    });
  });
});
