import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EvaluationsService } from './evaluations.service';
import { Evaluation } from './schema/evaluation.schema';
import { UsersService } from '../users/users.service';

const mockEvaluation = {
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  employeeId: new Types.ObjectId('507f1f77bcf86cd799439012'),
  evaluatorId: new Types.ObjectId('507f1f77bcf86cd799439013'),
  status: 'pending',
  skillEvaluations: [
    { skillId: new Types.ObjectId('507f1f77bcf86cd799439014'), newScore: 4, newLevel: 'advanced' },
  ],
};

const saveMock = jest.fn();
const execMock = jest.fn();

const mockEvaluationModel: any = jest.fn().mockImplementation(() => ({
  save: saveMock,
}));
mockEvaluationModel.find = jest.fn();
mockEvaluationModel.findById = jest.fn();
mockEvaluationModel.findByIdAndUpdate = jest.fn();
mockEvaluationModel.findByIdAndDelete = jest.fn();

const mockUsersService = {
  updateUserSkill: jest.fn(),
  addSkillToUser: jest.fn(),
};

describe('EvaluationsService', () => {
  let service: EvaluationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    saveMock.mockReset();
    execMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        { provide: getModelToken(Evaluation.name), useValue: mockEvaluationModel },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create an evaluation with pending status', async () => {
      const savedEval = { ...mockEvaluation, status: 'pending' };
      saveMock.mockResolvedValue(savedEval);

      const result = await service.create({ employeeId: 'emp-1', status: 'pending' });
      expect(result).toEqual(savedEval);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should auto-approve when status is "approved"', async () => {
      const savedEval = { ...mockEvaluation, status: 'approved' };
      saveMock.mockResolvedValue(savedEval);

      mockEvaluationModel.findById.mockResolvedValue(savedEval);
      mockUsersService.updateUserSkill.mockResolvedValue(undefined);

      const result = await service.create({ employeeId: 'emp-1', status: 'approved' });
      expect(result).toEqual(savedEval);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all evaluations', async () => {
      mockEvaluationModel.find.mockReturnValue({ exec: execMock });
      execMock.mockResolvedValue([mockEvaluation]);

      const result = await service.findAll();
      expect(result).toEqual([mockEvaluation]);
    });
  });

  // ─── findByEmployee ───────────────────────────────────────────────────────
  describe('findByEmployee', () => {
    it('should return evaluations for a specific employee', async () => {
      mockEvaluationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEvaluation]),
      });

      const result = await service.findByEmployee('507f1f77bcf86cd799439012');
      expect(result).toEqual([mockEvaluation]);
      expect(mockEvaluationModel.find).toHaveBeenCalled();
    });
  });

  // ─── findByManager ────────────────────────────────────────────────────────
  describe('findByManager', () => {
    it('should return evaluations for a specific manager', async () => {
      mockEvaluationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockEvaluation]),
      });

      const result = await service.findByManager('507f1f77bcf86cd799439013');
      expect(result).toEqual([mockEvaluation]);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update an evaluation', async () => {
      const updated = { ...mockEvaluation, status: 'rejected' };
      mockEvaluationModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update('507f1f77bcf86cd799439011', { status: 'rejected' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when evaluation not found', async () => {
      mockEvaluationModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('nonexistent', { status: 'rejected' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should call approve when status is approved', async () => {
      const updated = { ...mockEvaluation, status: 'approved' };
      mockEvaluationModel.findByIdAndUpdate.mockResolvedValue(updated);
      mockEvaluationModel.findById.mockResolvedValue(mockEvaluation);
      mockUsersService.updateUserSkill.mockResolvedValue(undefined);

      await service.update('507f1f77bcf86cd799439011', { status: 'approved' });
      expect(mockEvaluationModel.findById).toHaveBeenCalled();
    });
  });

  // ─── approve ──────────────────────────────────────────────────────────────
  describe('approve', () => {
    it('should return early when evaluation not found', async () => {
      mockEvaluationModel.findById.mockResolvedValue(null);
      await expect(service.approve('nonexistent')).resolves.toBeUndefined();
    });

    it('should update user skills for each evaluated skill', async () => {
      mockEvaluationModel.findById.mockResolvedValue(mockEvaluation);
      mockUsersService.updateUserSkill.mockResolvedValue(undefined);

      await service.approve('507f1f77bcf86cd799439011');
      expect(mockUsersService.updateUserSkill).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439014',
        expect.objectContaining({ level: 'advanced', etat: 'validated' })
      );
    });

    it('should fallback to addSkillToUser when updateUserSkill throws', async () => {
      mockEvaluationModel.findById.mockResolvedValue(mockEvaluation);
      mockUsersService.updateUserSkill.mockRejectedValue(new Error('not found'));
      mockUsersService.addSkillToUser.mockResolvedValue(undefined);

      await service.approve('507f1f77bcf86cd799439011');
      expect(mockUsersService.addSkillToUser).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        expect.objectContaining({ skillId: '507f1f77bcf86cd799439014', level: 'advanced', etat: 'validated' })
      );
    });

    it('should skip skills without skillId', async () => {
      const evalWithNoSkillId = {
        ...mockEvaluation,
        skillEvaluations: [{ skillId: null, newScore: 3, newLevel: 'intermediate' }],
      };
      mockEvaluationModel.findById.mockResolvedValue(evalWithNoSkillId);

      await service.approve('507f1f77bcf86cd799439011');
      expect(mockUsersService.updateUserSkill).not.toHaveBeenCalled();
    });
  });

  // ─── normalizeManagerRating (via approve) ─────────────────────────────────
  describe('normalizeManagerRating (indirectly via approve)', () => {
    const buildEvalWithScore = (score: number) => ({
      ...mockEvaluation,
      skillEvaluations: [{ skillId: { toString: () => 'skill-1' }, newScore: score, newLevel: 'advanced' }],
    });

    it.each([
      [0, 0],     // invalid → 0
      [3, 3],     // 1-5 range → stays
      [5, 5],     // max in range
      [8, 4],     // 0-10 → halved (8/2 = 4)
      [60, 3],    // 0-100 → divided by 20 (60/20 = 3)
      [200, 5],   // capped at 5
    ])('score %i should normalize to %i', async (rawScore, expected) => {
      mockEvaluationModel.findById.mockResolvedValue(buildEvalWithScore(rawScore));
      mockUsersService.updateUserSkill.mockImplementation((_, __, payload) => {
        expect(payload.hierarchie_eval).toBe(expected);
        return Promise.resolve();
      });

      await service.approve('507f1f77bcf86cd799439011');
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete an evaluation by id', async () => {
      mockEvaluationModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockEvaluation) });
      await expect(service.remove('507f1f77bcf86cd799439011')).resolves.toBeUndefined();
    });
  });
});
