import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RecommendationModelService } from './recommendation-model.service';
import { User } from '../users/schema/user.schema';
import { Activity } from '../activities/schema/activity.schema';
import { PrioritizationService } from '../prioritization/prioritization.service';

describe('RecommendationModelService', () => {
  let service: RecommendationModelService;
  let userModel: any;
  let activityModel: any;

  const mockUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    skills: [
      {
        skillId: { _id: new Types.ObjectId('507f1f77bcf86cd799439012'), name: 'TypeScript' },
        level: 'advanced',
        progression: 0.8,
      }
    ],
    yearsOfExperience: 5,
    rankScore: 80,
  };

  const mockActivity = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
    requiredSkills: [
      {
        skillId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        weight: 1.5,
      }
    ],
  };

  const mockUserModel = {
    findById: jest.fn(),
    find: jest.fn(),
  };

  const mockActivityModel = {
    findById: jest.fn(),
  };

  const mockParticipationModel = {
    find: jest.fn(),
  };

  const mockPrioritizationService = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationModelService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken('Activity'), useValue: mockActivityModel },
        { provide: getModelToken('Participation'), useValue: mockParticipationModel },
        { provide: PrioritizationService, useValue: mockPrioritizationService },
      ],
    }).compile();

    service = module.get<RecommendationModelService>(RecommendationModelService);
    userModel = module.get(getModelToken(User.name));
    activityModel = module.get(getModelToken('Activity'));
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('predictScore', () => {
    it('should predict a compatibility score between 0 and 1', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      mockActivityModel.findById.mockResolvedValue(mockActivity);
      mockParticipationModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      const score = await service.predictScore(mockUser._id.toString(), mockActivity._id.toString());
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return 1.0 content score if activity has no required skills', () => {
      const activityNoSkills = { requiredSkills: [] };
      const skillIds = ['s1'];
      const score = (service as any).computeCosineSimilarity(mockUser, activityNoSkills, skillIds);
      expect(score).toBe(1);
    });
  });

  describe('computeProfileScore', () => {
    it('should calculate profile score based on experience and rank', () => {
      const score = (service as any).computeProfileScore(mockUser);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('scoreLabel', () => {
    it('should return correct labels for scores', () => {
      expect((service as any).scoreLabel(0.9)).toBe('Top Pick');
      expect((service as any).scoreLabel(0.75)).toBe('Highly Recommended');
      expect((service as any).scoreLabel(0.55)).toBe('Recommended');
      expect((service as any).scoreLabel(0.2)).toBe('Consider');
      expect((service as any).scoreLabel(0.01)).toBe('Not Relevant');
    });
  });
});
