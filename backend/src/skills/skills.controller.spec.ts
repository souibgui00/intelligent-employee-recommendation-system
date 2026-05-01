import { Test, TestingModule } from '@nestjs/testing';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { AuditService } from '../common/audit/audit.service';

const mockSkill = { _id: 'skill-id-1', id: 'skill-id-1', name: 'TypeScript', category: 'Programming', type: 'technical' };

const mockSkillsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getGlobalSkillsDashboard: jest.fn(),
};

const mockAuditService = {
  logAction: jest.fn().mockResolvedValue(undefined),
};

const mockRequest = { user: { userId: 'admin-user-id', role: 'admin' } };

describe('SkillsController', () => {
  let controller: SkillsController;
  let skillsService: SkillsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        { provide: SkillsService, useValue: mockSkillsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
    skillsService = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a skill and log the action', async () => {
      const dto = { name: 'TypeScript', category: 'Programming', type: 'technical' };
      jest.spyOn(skillsService, 'create').mockResolvedValue(mockSkill as any);

      const result = await controller.create(dto as any, mockRequest as any);

      expect(result).toEqual(mockSkill);
      expect(skillsService.create).toHaveBeenCalledWith(dto);
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'CREATE_SKILL',
        entityType: 'SKILL',
        actorId: 'admin-user-id',
      }));
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all skills', async () => {
      jest.spyOn(skillsService, 'findAll').mockResolvedValue([mockSkill] as any);
      const result = await controller.findAll();
      expect(result).toEqual([mockSkill]);
      expect(skillsService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no skills', async () => {
      jest.spyOn(skillsService, 'findAll').mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a skill by id', async () => {
      jest.spyOn(skillsService, 'findOne').mockResolvedValue(mockSkill as any);
      const result = await controller.findOne('skill-id-1');
      expect(result).toEqual(mockSkill);
      expect(skillsService.findOne).toHaveBeenCalledWith('skill-id-1');
    });

    it('should return null when skill not found', async () => {
      jest.spyOn(skillsService, 'findOne').mockResolvedValue(null);
      const result = await controller.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── getGlobalDashboard ───────────────────────────────────────────────────
  describe('getGlobalDashboard', () => {
    it('should return global skills dashboard', async () => {
      const dashboard = { totalSkillsConfigured: 10, averageOrganizationScore: 75, topSkills: [] };
      jest.spyOn(skillsService, 'getGlobalSkillsDashboard').mockResolvedValue(dashboard);
      const result = await controller.getGlobalDashboard();
      expect(result).toEqual(dashboard);
      expect(skillsService.getGlobalSkillsDashboard).toHaveBeenCalled();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a skill and log the audit', async () => {
      const updateDto = { name: 'JavaScript' };
      const updated = { ...mockSkill, name: 'JavaScript' };
      jest.spyOn(skillsService, 'findOne').mockResolvedValue(mockSkill as any);
      jest.spyOn(skillsService, 'update').mockResolvedValue(updated as any);

      const result = await controller.update('skill-id-1', updateDto as any, mockRequest as any);

      expect(result).toEqual(updated);
      expect(skillsService.update).toHaveBeenCalledWith('skill-id-1', updateDto);
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE_SKILL',
        entityId: 'skill-id-1',
        actorId: 'admin-user-id',
        oldValue: mockSkill,
        newValue: updateDto,
      }));
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should remove a skill and log the audit', async () => {
      jest.spyOn(skillsService, 'findOne').mockResolvedValue(mockSkill as any);
      jest.spyOn(skillsService, 'remove').mockResolvedValue(mockSkill as any);

      const result = await controller.remove('skill-id-1', mockRequest as any);

      expect(result).toEqual(mockSkill);
      expect(skillsService.remove).toHaveBeenCalledWith('skill-id-1');
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'DELETE_SKILL',
        entityId: 'skill-id-1',
        oldValue: mockSkill,
      }));
    });
  });
});
