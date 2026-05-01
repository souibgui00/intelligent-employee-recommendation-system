import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification } from './schema/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

const mockNotification = {
  _id: 'notif-1',
  recipientId: 'user-1',
  title: 'Test',
  message: 'Hello',
  read: false,
  save: jest.fn(),
};

const mockNotificationModel: any = jest.fn().mockImplementation(() => mockNotification);
mockNotificationModel.find = jest.fn();
mockNotificationModel.findByIdAndUpdate = jest.fn();
mockNotificationModel.updateMany = jest.fn();
mockNotificationModel.findByIdAndDelete = jest.fn();

const mockGateway = {
  emitToUser: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Notification.name), useValue: mockNotificationModel },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and emit notification', async () => {
      mockNotification.save.mockResolvedValue(mockNotification);
      const result = await service.create({ recipientId: 'user-1', title: 'T', message: 'M' } as any);
      expect(result).toEqual(mockNotification);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 'newNotification', mockNotification);
    });

    it('should not emit if emitRealtime is false', async () => {
      mockNotification.save.mockResolvedValue(mockNotification);
      await service.create({ recipientId: 'user-1' } as any, { emitRealtime: false });
      expect(mockGateway.emitToUser).not.toHaveBeenCalled();
    });
  });

  describe('findByRecipient', () => {
    it('should find notifications by recipient', async () => {
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockNotification]),
      });
      const result = await service.findByRecipient('user-1');
      expect(result).toEqual([mockNotification]);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockNotification, read: true }),
      });
      const result = await service.markAsRead('notif-1');
      expect(result?.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for recipient', async () => {
      mockNotificationModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });
      const result = await service.markAllAsRead('user-1');
      expect(result.modifiedCount).toBe(1);
    });
  });

  describe('remove', () => {
    it('should remove notification', async () => {
      mockNotificationModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockNotification),
      });
      const result = await service.remove('notif-1');
      expect(result).toEqual(mockNotification);
    });
  });
});
