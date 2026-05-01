import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { EmailService } from '../common/services/email.service';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel = function(data: any) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        toObject: jest.fn().mockReturnValue(data),
      }),
    };
  };

  mockUserModel.findOne = jest.fn();
  mockUserModel.find = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.findByIdAndUpdate = jest.fn();

  const mockEmailService = {
    sendNewUserCredentials: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMatricule', () => {
    it('should generate an EMP prefix for employees', () => {
      // Accessing private method for testing
      const matricule = (service as any).generateMatricule('employee');
      expect(matricule).toMatch(/^EMP-\d{4}-\d{4}$/);
    });

    it('should generate an MGR prefix for managers', () => {
      const matricule = (service as any).generateMatricule('manager');
      expect(matricule).toMatch(/^MGR-\d{4}-\d{4}$/);
    });
  });

  describe('computeWeightedSkillScore', () => {
    it('should calculate weighted scores correctly', () => {
      const skills = [
        { skillId: { type: 'knowledge' }, score: 80 },
        { skillId: { type: 'know-how' }, score: 60 },
      ];
      const result = (service as any).computeWeightedSkillScore(skills);
      expect(result.weightedScore).toBeDefined();
      expect(result.categoryCounts.knowledge).toBe(1);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ email }),
      });

      const result = await service.findByEmail(email);
      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
    });
  });
});
