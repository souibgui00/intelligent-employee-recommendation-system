import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SkillsService } from './skills.service';
import { Skill } from './schema/skill.schema';

const mockSkill = { _id: 'skill-id-1', name: 'TypeScript', category: 'Programming', type: 'technical' };

const execMock = jest.fn();
const mockSkillModel: any = jest.fn().mockImplementation(() => ({ save: jest.fn().mockResolvedValue(mockSkill) }));
mockSkillModel.find = jest.fn().mockReturnValue({ exec: execMock, select: jest.fn().mockReturnValue([]) });
mockSkillModel.findById = jest.fn().mockReturnValue({ exec: execMock });
mockSkillModel.findOne = jest.fn().mockReturnValue({ exec: execMock });
mockSkillModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: execMock });
mockSkillModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: execMock });
mockSkillModel.countDocuments = jest.fn().mockResolvedValue(5);
mockSkillModel.db = { model: jest.fn() };

describe('SkillsService', () => {
  let service: SkillsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    execMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getModelToken(Skill.name), useValue: mockSkillModel },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return a new skill', async () => {
      const dto = { name: 'TypeScript', category: 'Programming', type: 'technical' };
      const result = await service.create(dto as any);
      expect(result).toEqual(mockSkill);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all skills', async () => {
      execMock.mockResolvedValue([mockSkill]);
      const result = await service.findAll();
      expect(result).toEqual([mockSkill]);
      expect(mockSkillModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no skills', async () => {
      execMock.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return null when id is empty', async () => {
      const result = await service.findOne('');
      expect(result).toBeNull();
    });

    it('should find by ObjectId and return the skill', async () => {
      execMock.mockResolvedValue(mockSkill);
      const result = await service.findOne('skill-id-1');
      expect(result).toEqual(mockSkill);
    });

    it('should fallback to name search when findById throws', async () => {
      mockSkillModel.findById.mockReturnValueOnce({ exec: jest.fn().mockRejectedValue(new Error('Invalid ObjectId')) });
      execMock.mockResolvedValue(mockSkill);
      const result = await service.findOne('TypeScript');
      expect(result).toEqual(mockSkill);
    });

    it('should fallback to name search when findById returns null', async () => {
      mockSkillModel.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      execMock.mockResolvedValue(mockSkill);
      const result = await service.findOne('TypeScript');
      expect(result).toEqual(mockSkill);
    });
  });

  // ─── findByName ───────────────────────────────────────────────────────────
  describe('findByName', () => {
    it('should find a skill by name (case-insensitive)', async () => {
      execMock.mockResolvedValue(mockSkill);
      const result = await service.findByName('typescript');
      expect(result).toEqual(mockSkill);
      expect(mockSkillModel.findOne).toHaveBeenCalled();
    });

    it('should return null when skill not found by name', async () => {
      execMock.mockResolvedValue(null);
      const result = await service.findByName('NonExistent');
      expect(result).toBeNull();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return the updated skill', async () => {
      const updated = { ...mockSkill, name: 'JavaScript' };
      execMock.mockResolvedValue(updated);
      const result = await service.update('skill-id-1', { name: 'JavaScript' } as any);
      expect(result).toEqual(updated);
      expect(mockSkillModel.findByIdAndUpdate).toHaveBeenCalledWith('skill-id-1', { name: 'JavaScript' }, { new: true });
    });

    it('should return null when skill to update not found', async () => {
      execMock.mockResolvedValue(null);
      const result = await service.update('nonexistent', { name: 'X' } as any);
      expect(result).toBeNull();
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a skill by id', async () => {
      execMock.mockResolvedValue(mockSkill);
      const result = await service.remove('skill-id-1');
      expect(result).toEqual(mockSkill);
      expect(mockSkillModel.findByIdAndDelete).toHaveBeenCalledWith('skill-id-1');
    });
  });

  // ─── getGlobalSkillsDashboard ─────────────────────────────────────────────
  describe('getGlobalSkillsDashboard', () => {
    it('should return dashboard with zero totals when no users have skills', async () => {
      const mockUserModel = {
        find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([]) }),
      };
      mockSkillModel.db.model.mockReturnValue(mockUserModel);
      mockSkillModel.countDocuments.mockResolvedValue(10);
      mockSkillModel.find.mockReturnValueOnce({ select: jest.fn().mockResolvedValue([]) });

      const result = await service.getGlobalSkillsDashboard();
      expect(result.totalSkillsConfigured).toBe(10);
      expect(result.totalEvaluations).toBe(0);
      expect(result.averageOrganizationScore).toBe(0);
      expect(result.topSkills).toEqual([]);
    });

    it.todo('should aggregate skill data from users correctly');
    
    it.skip('should aggregate skill data from users correctly', async () => {
      const id1 = new Types.ObjectId('507f1f77bcf86cd799439014');
      const id2 = new Types.ObjectId('507f1f77bcf86cd799439015');
      const users = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
          skills: [
            { skillId: id1, score: 80, level: 'advanced' },
            { skillId: id2, score: 60, level: 'intermediate' },
          ],
        },
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439017'),
          skills: [
            { skillId: id1, score: 90, level: 'expert' },
          ],
        },
      ];

      const skillDocs = [
        { _id: id1, name: 'TypeScript', category: 'Programming', type: 'technical' },
        { _id: id2, name: 'React', category: 'Frontend', type: 'technical' },
      ];

      const mockUserModel = {
        find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(users) }),
      };
      mockSkillModel.db.model.mockReturnValue(mockUserModel);
      mockSkillModel.countDocuments.mockResolvedValue(5);
      
      const mockSelect = jest.fn().mockResolvedValue(skillDocs);
      mockSkillModel.find.mockReturnValue({ select: mockSelect });

      const result = await service.getGlobalSkillsDashboard();
      expect(result.totalEvaluations).toBe(3);
      expect(result.topSkills.length).toBe(2);
      expect(result.levelDistribution.advanced).toBe(1);
      expect(result.levelDistribution.expert).toBe(1);
      expect(result.levelDistribution.intermediate).toBe(1);
    });

    it('should skip skills without skillId', async () => {
      const users = [{ _id: 'user-1', skills: [{ skillId: null, score: 80 }] }];
      const mockUserModel = { find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(users) }) };
      mockSkillModel.db.model.mockReturnValue(mockUserModel);
      mockSkillModel.countDocuments.mockResolvedValue(0);
      mockSkillModel.find.mockReturnValueOnce({ select: jest.fn().mockResolvedValue([]) });

      const result = await service.getGlobalSkillsDashboard();
      expect(result.totalEvaluations).toBe(0);
    });

    it('should handle users with no skills array', async () => {
      const users = [{ _id: 'user-1', skills: null }];
      const mockUserModel = { find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(users) }) };
      mockSkillModel.db.model.mockReturnValue(mockUserModel);
      mockSkillModel.countDocuments.mockResolvedValue(2);
      mockSkillModel.find.mockReturnValueOnce({ select: jest.fn().mockResolvedValue([]) });

      const result = await service.getGlobalSkillsDashboard();
      expect(result.totalEvaluations).toBe(0);
      expect(result.totalSkillsConfigured).toBe(2);
    });
  });
});
