import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ScoringService } from './scoring.service';
import { User } from '../users/schema/user.schema';
import { Activity } from '../activities/schema/activity.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ScoringService', () => {
  let service: ScoringService;
  let userModel: any;
  let activityModel: any;

  const mockUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    skills: [
      {
        skillId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        level: 'intermediate',
        auto_eval: 60,
        hierarchie_eval: 80,
        lastUpdated: new Date(),
      }
    ],
    yearsOfExperience: 5,
    save: jest.fn().mockResolvedValue(true),
    markModified: jest.fn(),
  };

  const mockActivity = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
    requiredSkills: [
      {
        skillId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        weight: 0.8,
        requiredLevel: 'advanced',
      }
    ],
  };

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockActivityModel = {
    findById: jest.fn(),
  };

  const mockParticipationModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken('Activity'), useValue: mockActivityModel },
        { provide: getModelToken('Participation'), useValue: mockParticipationModel },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    userModel = module.get(getModelToken(User.name));
    activityModel = module.get(getModelToken('Activity'));
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('calculateSkillScore', () => {
    it('should calculate correct skill score', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      const score = await service.calculateSkillScore(mockUser._id.toString(), mockUser.skills[0].skillId.toString());
      
      // Base: intermediate = 50
      // Experience: 5 * 2 = 10
      // Progression: recently updated = 5
      // Feedback: (0.4*3 + 0.6*4)*2 = (1.2 + 2.4)*2 = 7.2
      // Total: 50 + 10 + 5 + 7.2 = 72.2
      expect(score).toBe(72.2);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.calculateSkillScore('id', 'sid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateGlobalActivityScore', () => {
    it('should calculate weighted average score for activity', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const score = await service.calculateGlobalActivityScore(mockUser._id.toString(), mockActivity._id.toString());
      // Only one skill, score was 72.2, weight 0.8.
      // Weighted Sum: 72.2 * 0.8 = 57.76
      // Normalized: 57.76 / 0.8 = 72.2
      expect(score).toBe(72.2);
    });
  });

  describe('getActivityMatchPercentage', () => {
    it('should return match percentage based on levels', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const match = await service.getActivityMatchPercentage(mockUser._id.toString(), mockActivity._id.toString());
      // User intermediate (2) vs Required advanced (3)
      // 0 match
      expect(match).toBe(0);
    });

    it('should return 100% match if user level meets or exceeds required', async () => {
      const advancedUser = {
        ...mockUser,
        skills: [{ ...mockUser.skills[0], level: 'advanced' }]
      };
      mockUserModel.findById.mockResolvedValue(advancedUser);
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const match = await service.getActivityMatchPercentage(mockUser._id.toString(), mockActivity._id.toString());
      expect(match).toBe(100);
    });
  });

  describe('updateSkoresAfterParticipation', () => {
    it('should update skill score after participation', async () => {
      mockUserModel.findById.mockResolvedValue({ ...mockUser });
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const result = await service.updateSkoresAfterParticipation(mockUser._id.toString(), mockActivity._id.toString(), 80);
      expect(result.updatedSkills).toBe(1);
    });

    it('should throw BadRequestException for invalid rating', async () => {
      await expect(service.updateSkoresAfterParticipation('u', 'a', 150)).rejects.toThrow(BadRequestException);
    });
  });
});
