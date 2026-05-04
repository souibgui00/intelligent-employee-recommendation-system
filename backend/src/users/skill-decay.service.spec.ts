import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SkillDecayService } from './skill-decay.service';
import { UsersService } from './users.service';
import { Types } from 'mongoose';


describe('SkillDecayService', () => {
  let service: SkillDecayService;

  const mockUser1Id = new Types.ObjectId().toHexString();
  const mockUser2Id = new Types.ObjectId().toHexString();
  const mockSkillId = new Types.ObjectId().toHexString();

  const mockUserWithRecentSkills = {
    _id: mockUser1Id,
    name: 'User 1',
    skills: [
      {
        name: 'Node.js',
        score: 100,
        lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
      {
        name: 'TypeScript',
        score: 95,
        lastUpdated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      },
    ],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserWithStaleSkills = {
    _id: mockUser2Id,
    name: 'User 2',
    skills: [
      {
        name: 'Java',
        score: 80,
        lastUpdated: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago (>90 days)
      },
      {
        name: 'Python',
        score: 85,
        lastUpdated: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago (>180 days)
      },
      {
        name: 'C++',
        score: 15,
        lastUpdated: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000), // old, but should floor at 10
      },
    ],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserWithNeverUpdatedSkills = {
    _id: new Types.ObjectId().toHexString(),
    name: 'User 3',
    skills: [
      {
        name: 'Rust',
        score: 70,
        lastUpdated: null, // never updated
      },
    ],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserModel = {
    find: jest.fn(),
  };

  function chainable(result: any) {
    const p = Promise.resolve(result) as any;
    p.exec = jest.fn().mockResolvedValue(result);
    return p;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillDecayService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<SkillDecayService>(SkillDecayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runWeeklySkillDecay', () => {
    it('should not decay skills updated within 90 days', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithRecentSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // Scores should remain unchanged
      expect(userCopy.skills[0].score).toBe(100);
      expect(userCopy.skills[1].score).toBe(95);
    });

    it('should apply 5% decay for skills stale 90-180 days', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // Java skill (100 days old): 80 * 0.95 = 76
      expect(userCopy.skills[0].score).toBe(76);
    });

    it('should apply 10% decay for skills stale >180 days', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // Python skill (200 days old): floor(85 * 0.10) = 8, so 85 - 8 = 77
      expect(userCopy.skills[1].score).toBe(77);
    });

    it('should respect minimum score floor of 10', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // C++ skill (250 days old, score 15): 15 * 0.90 = 13.5 → 13, still > 10
      // But if score were lower, it should floor at 10
      expect(userCopy.skills[2].score).toBeGreaterThanOrEqual(10);
    });

    it('should treat never-updated skills as very old', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithNeverUpdatedSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // Rust skill (never updated, treated as very old): 70 * 0.90 = 63
      expect(userCopy.skills[0].score).toBe(63);
    });

    it('should mark decayed skills with current timestamp', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      const beforeRun = new Date();
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      const afterRun = new Date();
      const decayedSkillTimestamp = new Date(userCopy.skills[0].lastUpdated);

      expect(decayedSkillTimestamp.getTime()).toBeGreaterThanOrEqual(beforeRun.getTime());
      expect(decayedSkillTimestamp.getTime()).toBeLessThanOrEqual(afterRun.getTime());
    });

    it('should save modified users', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      expect(userCopy.save).toHaveBeenCalled();
    });

    it('should not save users with no skill decay', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithRecentSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      expect(userCopy.save).not.toHaveBeenCalled();
    });

    it('should process multiple users', async () => {
      const user1Copy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      const user2Copy = JSON.parse(JSON.stringify(mockUserWithNeverUpdatedSkills));
      user1Copy.save = jest.fn().mockResolvedValue(true);
      user2Copy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([user1Copy, user2Copy]));

      await service.runWeeklySkillDecay();

      expect(user1Copy.save).toHaveBeenCalled();
      expect(user2Copy.save).toHaveBeenCalled();
    });

    it('should handle users with no skills', async () => {
      const userNothings = { _id: new Types.ObjectId(), name: 'User', skills: null, save: jest.fn() };
      mockUserModel.find.mockReturnValue(chainable([userNothings]));

      await service.runWeeklySkillDecay();

      expect(userNothings.save).not.toHaveBeenCalled();
    });
  });

  describe('triggerManualDecay', () => {
    it('should return summary with users affected and skills decayed', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      const result = await service.triggerManualDecay();

      expect(result).toHaveProperty('usersAffected');
      expect(result).toHaveProperty('skillsDecayed');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.usersAffected).toBe('number');
      expect(typeof result.skillsDecayed).toBe('number');
    });

    it('should decay skills during manual trigger', async () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      const result = await service.triggerManualDecay();

      // Should have affected the stale skills
      expect(result.skillsDecayed).toBeGreaterThan(0);
      expect(result.usersAffected).toBeGreaterThan(0);
    });

    it('should return current ISO timestamp', async () => {
      const beforeTrigger = new Date().toISOString();
      const userCopy = JSON.parse(JSON.stringify(mockUserWithRecentSkills));
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      const result = await service.triggerManualDecay();
      const afterTrigger = new Date().toISOString();

      expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTrigger).getTime());
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(new Date(afterTrigger).getTime());
    });

    it('should count correct number of affected users', async () => {
      const user1Copy = JSON.parse(JSON.stringify(mockUserWithStaleSkills));
      const user2Copy = JSON.parse(JSON.stringify(mockUserWithRecentSkills));
      user1Copy.save = jest.fn().mockResolvedValue(true);
      user2Copy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([user1Copy, user2Copy]));

      const result = await service.triggerManualDecay();

      // Only user1 should be affected (has stale skills)
      expect(result.usersAffected).toBeGreaterThan(0);
    });
  });

  describe('Decay calculation edge cases', () => {
    it('should handle scores approaching minimum floor', async () => {
      const userWithLowScore = {
        _id: new Types.ObjectId(),
        skills: [
          {
            name: 'Old Skill',
            score: 11,
            lastUpdated: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };
      const userCopy = JSON.parse(JSON.stringify(userWithLowScore));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // 11 * 0.90 = 9.9 → 9, should floor to 10
      expect(userCopy.skills[0].score).toBe(10);
    });

    it('should handle exactly 90 days old (boundary)', async () => {
      const userExactly90Days = {
        _id: new Types.ObjectId(),
        skills: [
          {
            name: 'Boundary Skill',
            score: 100,
            lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000 - 1000), // 1 second over 90 days
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };
      const userCopy = JSON.parse(JSON.stringify(userExactly90Days));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // Should apply 5% decay
      expect(userCopy.skills[0].score).toBe(95);
    });

    it('should handle exactly 180 days old (boundary)', async () => {
      const userExactly180Days = {
        _id: new Types.ObjectId(),
        skills: [
          {
            name: 'Old Boundary Skill',
            score: 100,
            lastUpdated: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000 - 1000), // 1 second over 180 days
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };
      const userCopy = JSON.parse(JSON.stringify(userExactly180Days));
      userCopy.save = jest.fn().mockResolvedValue(true);
      mockUserModel.find.mockReturnValue(chainable([userCopy]));

      await service.runWeeklySkillDecay();

      // Should apply 10% decay
      expect(userCopy.skills[0].score).toBe(90);
    });
  });
});
