import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PrioritizationService } from './prioritization.service';
import { User } from '../users/schema/user.schema';
import { Skill } from '../skills/schema/skill.schema';
import { ScoringService } from '../scoring/scoring.service';

describe('PrioritizationService', () => {
  let service: PrioritizationService;
  let userModel: any;
  let skillModel: any;

  const validSkillId = new Types.ObjectId().toString();
  const validActivityId = new Types.ObjectId().toString();

  const mockUser = {
    _id: new Types.ObjectId(),
    name: 'Test User',
    skills: []
  };

  const mockSkill = {
    _id: new Types.ObjectId(validSkillId),
    name: 'TypeScript'
  };

  const mockUserModel = {
    findById: jest.fn(),
    find: jest.fn()
  };

  const mockActivityModel = {
    findById: jest.fn()
  };

  const mockParticipationModel = {
    find: jest.fn()
  };

  const mockSkillModel = {
    findById: jest.fn(),
    find: jest.fn()
  };

  const mockScoringService = {
    calculateSkillMatch: jest.fn().mockReturnValue(0.8)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrioritizationService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken('Activity'), useValue: mockActivityModel },
        { provide: getModelToken('Participation'), useValue: mockParticipationModel },
        { provide: getModelToken(Skill.name), useValue: mockSkillModel },
        { provide: ScoringService, useValue: mockScoringService },
      ],
    }).compile();

    service = module.get<PrioritizationService>(PrioritizationService);
    userModel = module.get(getModelToken(User.name));
    skillModel = module.get(getModelToken(Skill.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('identifySkillGaps', () => {
    it('should identify gaps when user lacks a skill', async () => {
      const activity = {
        requiredSkills: [
          { skillId: validSkillId, requiredLevel: 'intermediate' }
        ]
      };
      const user = { skills: [] };

      mockSkillModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSkill)
      });

      const gaps = await service.identifySkillGaps(user as any, activity as any);
      expect(gaps).toHaveLength(1);
      expect(gaps[0].skillName).toBe('TypeScript');
    });

    it('should identify level mismatch gaps', async () => {
      const activity = {
        requiredSkills: [
          { skillId: validSkillId, requiredLevel: 'expert' }
        ]
      };
      const user = { 
        skills: [{ skillId: validSkillId, level: 'beginner' }] 
      };

      mockSkillModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSkill)
      });

      const gaps = await service.identifySkillGaps(user as any, activity as any);
      expect(gaps).toHaveLength(1);
      expect(gaps[0].gap).toBe('level_mismatch');
    });
  });

  describe('applyIntentAwareScoring', () => {
    it('should prioritize candidates based on intent', () => {
      const activity = { intent: 'development' };
      const candidates = [
        { name: 'John', score: 0.5, skillGaps: [{ skillId: 's1' }, { skillId: 's2' }] },
        { name: 'Jane', score: 0.8, skillGaps: [] }
      ];

      const results = service.applyIntentAwareScoring(candidates, activity as any);
      expect(results[0].name).toBe('John'); 
    });
  });
});
