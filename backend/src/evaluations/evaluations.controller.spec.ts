import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

const mockEvaluation = { _id: 'eval-1', employeeId: 'emp-1', status: 'pending' };

const mockEvaluationsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByEmployee: jest.fn(),
  findByManager: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('EvaluationsController', () => {
  let controller: EvaluationsController;
  let service: EvaluationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController],
      providers: [{ provide: EvaluationsService, useValue: mockEvaluationsService }],
    }).compile();

    controller = module.get<EvaluationsController>(EvaluationsController);
    service = module.get<EvaluationsService>(EvaluationsService);
  });

  it('should be defined', () => expect(controller).toBeDefined());

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create evaluation with manager id from token', async () => {
      const req = { user: { userId: 'mgr-1' } };
      const body = { employeeId: 'emp-1', status: 'pending' };
      jest.spyOn(service, 'create').mockResolvedValue(mockEvaluation as any);

      const result = await controller.create(req, body);
      expect(result).toEqual(mockEvaluation);
      expect(service.create).toHaveBeenCalledWith({ ...body, managerId: 'mgr-1' });
    });
  });

  // ─── getEvaluations ───────────────────────────────────────────────────────
  describe('getEvaluations', () => {
    it('should return all evaluations for admin', async () => {
      const req = { user: { userId: 'admin-1', role: 'ADMIN' } };
      jest.spyOn(service, 'findAll').mockResolvedValue([mockEvaluation] as any);
      const result = await controller.getEvaluations(req);
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockEvaluation]);
    });

    it('should return all evaluations for hr', async () => {
      const req = { user: { userId: 'hr-1', role: 'hr' } };
      jest.spyOn(service, 'findAll').mockResolvedValue([mockEvaluation] as any);
      const result = await controller.getEvaluations(req);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return manager evaluations for manager role', async () => {
      const req = { user: { userId: 'mgr-1', role: 'manager' } };
      jest.spyOn(service, 'findByManager').mockResolvedValue([mockEvaluation] as any);
      const result = await controller.getEvaluations(req);
      expect(service.findByManager).toHaveBeenCalledWith('mgr-1');
      expect(result).toEqual([mockEvaluation]);
    });

    it('should return employee evaluations for employee role', async () => {
      const req = { user: { userId: 'emp-1', role: 'employee' } };
      jest.spyOn(service, 'findByEmployee').mockResolvedValue([mockEvaluation] as any);
      const result = await controller.getEvaluations(req);
      expect(service.findByEmployee).toHaveBeenCalledWith('emp-1');
      expect(result).toEqual([mockEvaluation]);
    });
  });

  // ─── getMyEvaluations ─────────────────────────────────────────────────────
  describe('getMyEvaluations', () => {
    it('should return evaluations for current user', async () => {
      const req = { user: { userId: 'emp-1' } };
      jest.spyOn(service, 'findByEmployee').mockResolvedValue([mockEvaluation] as any);
      const result = await controller.getMyEvaluations(req);
      expect(result).toEqual([mockEvaluation]);
      expect(service.findByEmployee).toHaveBeenCalledWith('emp-1');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update an evaluation', async () => {
      const updated = { ...mockEvaluation, status: 'approved' };
      jest.spyOn(service, 'update').mockResolvedValue(updated as any);
      const result = await controller.update('eval-1', { status: 'approved' });
      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith('eval-1', { status: 'approved' });
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete an evaluation', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      await controller.remove('eval-1');
      expect(service.remove).toHaveBeenCalledWith('eval-1');
    });
  });
});
