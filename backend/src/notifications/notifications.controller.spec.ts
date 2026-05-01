import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const mockNotification = { _id: 'notif-1', recipientId: 'user-1', title: 'T' };

const mockNotificationsService = {
  create: jest.fn(),
  findByRecipient: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  remove: jest.fn(),
};

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create notification', async () => {
      const dto = { recipientId: 'user-1', title: 'T', message: 'M' };
      mockNotificationsService.create.mockResolvedValue(mockNotification);
      const result = await controller.create(dto as any);
      expect(result).toEqual(mockNotification);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should find notifications for current user', async () => {
      const req = { user: { userId: 'user-1' } };
      mockNotificationsService.findByRecipient.mockResolvedValue([mockNotification]);
      const result = await controller.findAll(req);
      expect(result).toEqual([mockNotification]);
      expect(service.findByRecipient).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue({ ...mockNotification, read: true });
      const result = await controller.markAsRead('notif-1');
      expect(result?.read).toBe(true);
      expect(service.markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for current user', async () => {
      const req = { user: { userId: 'user-1' } };
      mockNotificationsService.markAllAsRead.mockResolvedValue({ modifiedCount: 5 });
      const result = await controller.markAllAsRead(req);
      expect(result.modifiedCount).toBe(5);
      expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('remove', () => {
    it('should remove notification', async () => {
      mockNotificationsService.remove.mockResolvedValue(undefined);
      await controller.remove('notif-1');
      expect(service.remove).toHaveBeenCalledWith('notif-1');
    });
  });
});
