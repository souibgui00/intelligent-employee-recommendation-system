import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AssignmentsService } from './assignments.service';
import { Assignment } from './schema/assignment.schema';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ParticipationsService } from '../participations/participations.service';
import { BadRequestException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let activitiesService: any;
  let usersService: any;
  let notificationsService: any;

  const validActivityId = new Types.ObjectId().toString();
  const validUserId = new Types.ObjectId().toString();
  const validManagerId = new Types.ObjectId().toString();

  const mockAssignment = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    activityId: new Types.ObjectId(),
    status: 'pending',
    save: jest.fn().mockResolvedValue(true)
  };

  // Proper constructor mock for Mongoose
  function MockAssignmentModel(dto: any) {
    return { ...mockAssignment, ...dto, save: jest.fn().mockResolvedValue(mockAssignment) };
  }
  MockAssignmentModel.find = jest.fn();
  MockAssignmentModel.findOne = jest.fn();
  MockAssignmentModel.findById = jest.fn();
  MockAssignmentModel.findByIdAndDelete = jest.fn();

  const mockActivitiesService = { findOne: jest.fn() };
  const mockNotificationsService = { create: jest.fn().mockResolvedValue({ _id: 'notif-1' }) };
  const mockUsersService = { 
    findOne: jest.fn(), 
    getManagerByDepartment: jest.fn(), 
    findRawDepartmentId: jest.fn() 
  };
  const mockNotificationsGateway = { emitToUser: jest.fn() };
  const mockParticipationsService = { create: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: getModelToken(Assignment.name), useValue: MockAssignmentModel },
        { provide: ActivitiesService, useValue: mockActivitiesService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
        { provide: ParticipationsService, useValue: mockParticipationsService },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
    usersService = module.get<UsersService>(UsersService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('forwardToManager', () => {
    it('should successfully forward recommendations if activity is approved', async () => {
      activitiesService.findOne.mockResolvedValue({ _id: validActivityId, title: 'Test', workflowStatus: 'approved' });
      usersService.findOne.mockResolvedValue({ _id: validManagerId, role: Role.MANAGER });
      MockAssignmentModel.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      
      const dto = { activityId: validActivityId, managerId: validManagerId, candidateIds: [validUserId], aiScore: 0.9 };
      const result = await service.forwardToManager(dto as any, validManagerId);
      
      expect(result.success).toBe(true);
      expect(notificationsService.create).toHaveBeenCalled();
    });
  });
});
