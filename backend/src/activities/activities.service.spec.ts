import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ActivitiesService } from './activities.service';
import { Activity } from './schema/activity.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { RecommendationModelService } from '../scoring/recommendation-model.service';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activityModel: any;
  let notificationsService: any;
  let usersService: any;
  let httpService: any;

  const validId = new Types.ObjectId().toString();

  const mockActivity = {
    _id: new Types.ObjectId(),
    title: 'Test Activity',
    workflowStatus: 'pending_approval',
    capacity: 10,
    enrolledCount: 0,
    createdBy: new Types.ObjectId(),
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnThis(),
  };

  const mockActivityModel: any = jest.fn().mockImplementation(() => mockActivity);
  mockActivityModel.find = jest.fn();
  mockActivityModel.findById = jest.fn();
  mockActivityModel.findByIdAndUpdate = jest.fn();
  mockActivityModel.findByIdAndDelete = jest.fn();

  const mockParticipationModel = { find: jest.fn() };
  const mockAssignmentModel = { find: jest.fn() };

  const mockNotificationsService = { create: jest.fn().mockResolvedValue({ _id: 'notif-1' }) };
  const mockUsersService = { 
    findOne: jest.fn(), 
    findAll: jest.fn(),
    findRawDepartmentId: jest.fn(),
    getManagerByDepartment: jest.fn() 
  };
  const mockRecommendationModelService = { predictScore: jest.fn() };
  const mockPrioritizationService = { 
    inferIntent: jest.fn().mockReturnValue('development'),
    identifySkillGaps: jest.fn().mockResolvedValue([]),
    applyIntentAwareScoring: jest.fn().mockImplementation((cands) => cands)
  };
  const mockHttpService = { 
    post: jest.fn().mockReturnValue(of({ data: { scores: [] } })),
    get: jest.fn().mockReturnValue(of({ data: { employees: [] } }))
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: getModelToken(Activity.name), useValue: mockActivityModel },
        { provide: getModelToken('Participation'), useValue: mockParticipationModel },
        { provide: getModelToken('Assignment'), useValue: mockAssignmentModel },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RecommendationModelService, useValue: mockRecommendationModelService },
        { provide: PrioritizationService, useValue: mockPrioritizationService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    activityModel = module.get(getModelToken(Activity.name));
    notificationsService = module.get<NotificationsService>(NotificationsService);
    usersService = module.get<UsersService>(UsersService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create an activity and notify manager if creator has one', async () => {
      const dto = { title: 'New Program' };
      const creator = { _id: 'u1', name: 'HR User', manager_id: new Types.ObjectId() };
      usersService.findOne.mockResolvedValue(creator);
      mockActivity.save.mockResolvedValue(mockActivity);

      const result = await service.create(dto as any, 'u1');
      expect(result).toBeDefined();
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('enroll', () => {
    it('should increment enrolledCount for approved activity', async () => {
      const activity = { ...mockActivity, workflowStatus: 'approved', capacity: 10, enrolledCount: 5 };
      mockActivityModel.findById.mockResolvedValue(activity);
      mockActivityModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...activity, enrolledCount: 6 })
      });

      const result = await service.enroll(mockActivity._id.toString());
      expect(result!.enrolledCount).toBe(6);
    });
  });

  describe('approve', () => {
    it('should update status to approved and notify creator', async () => {
      const activity = { ...mockActivity, workflowStatus: 'approved' };
      mockActivityModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(activity)
      });

      await service.approve(validId, 'admin-1');
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('getRecommendationsForActivity', () => {
    it('should return ranked candidates for an activity', async () => {
      const activity = { 
        _id: validId, 
        title: 'React Training', 
        intent: 'development',
        requiredSkills: [{ skillId: { _id: 's1', name: 'React' }, weight: 1 }]
      };
      const candidate = { 
        _id: 'u1', 
        name: 'John', 
        email: 'j@j.com', 
        matricule: 'M1', 
        skills: [{ skillId: 's1', level: 'beginner' }] 
      };

      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(activity)
      });
      usersService.findAll.mockResolvedValue([candidate]);
      mockParticipationModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });
      mockAssignmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      httpService.post.mockReturnValue(of({ data: { scores: [{ userId: 'u1', finalScore: 0.9 }] } }));
      
      const result = await service.getRecommendationsForActivity(validId);
      expect(result.candidates).toBeDefined();
    });
  });

  describe('extractSkillsFromDescription', () => {
    it('should call NLP service to extract skills', async () => {
      const mockData = { skills: ['React'] };
      httpService.post.mockReturnValue(of({ data: mockData }));
      const result = await service.extractSkillsFromDescription('desc', 'title');
      expect(result).toEqual(mockData);
    });
  });
});
