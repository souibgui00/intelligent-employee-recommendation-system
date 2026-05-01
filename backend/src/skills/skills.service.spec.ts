import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SkillsService } from './skills.service';
import { Skill } from './schema/skill.schema';
import { Types } from 'mongoose';

describe('SkillsService', () => {
  let service: SkillsService;

  const mockSkillModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    db: {
      model: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      }),
    },
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getModelToken(Skill.name),
          useValue: mockSkillModel,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of skills', async () => {
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ name: 'JavaScript' }]),
      });
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('JavaScript');
    });
  });

  describe('findByName', () => {
    it('should find a skill by name case-insensitive', async () => {
      mockSkillModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ name: 'JavaScript' }),
      });
      const result = await service.findByName('javascript');
      expect(result?.name).toBe('JavaScript');
    });
  });
});
