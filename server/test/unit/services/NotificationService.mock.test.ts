import { NotificationService } from '@services/NotificationService';
import { ReportStatus } from '@daos/ReportDAO';
import { NewNotificationDTO } from '@dtos/NotificationDTO';

describe('NotificationService (mock)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('findAllNotifications', () => {
    it('should return all notifications mapped to DTOs', async () => {
      const service = new NotificationService();

      const mockNotifications = [
        {
          id: 1,
          previousStatus: ReportStatus.PendingApproval,
          newStatus: ReportStatus.Assigned,
          user: { id: 1, username: 'user1', email: 'user1@test.com' },
          report: { 
            id: 10, 
            title: 'Report 1',
            category: { id: 1, name: 'Category 1' },
            createdBy: { id: 1, username: 'creator1' }
          },
          seen: false,
          createdAt: new Date('2024-01-01')
        } as any,
        {
          id: 2,
          previousStatus: ReportStatus.Assigned,
          newStatus: ReportStatus.InProgress,
          user: { id: 2, username: 'user2', email: 'user2@test.com' },
          report: { 
            id: 20, 
            title: 'Report 2',
            category: { id: 2, name: 'Category 2' },
            createdBy: { id: 2, username: 'creator2' }
          },
          seen: true,
          createdAt: new Date('2024-01-02')
        } as any
      ];

      // @ts-ignore
      service['notificationRepo'] = {
        findAllNotifications: jest.fn().mockResolvedValue(mockNotifications)
      };

      const result = await service.findAllNotifications();

      expect((service as any).notificationRepo.findAllNotifications).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        seen: false
      });
      expect(result[1]).toMatchObject({
        id: 2,
        seen: true
      });
    });

    it('should return empty array when no notifications exist', async () => {
      const service = new NotificationService();

      // @ts-ignore
      service['notificationRepo'] = {
        findAllNotifications: jest.fn().mockResolvedValue([])
      };

      const result = await service.findAllNotifications();

      expect((service as any).notificationRepo.findAllNotifications).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should propagate errors from repository', async () => {
      const service = new NotificationService();

      // @ts-ignore
      service['notificationRepo'] = {
        findAllNotifications: jest.fn().mockRejectedValue(new Error('database error'))
      };

      await expect(service.findAllNotifications()).rejects.toThrow('database error');
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully when user and report exist', async () => {
      const service = new NotificationService();

      const mockUser = { id: 5, username: 'testuser', email: 'test@test.com' } as any;
      const mockReport = { 
        id: 15, 
        title: 'Test Report',
        category: { id: 1, name: 'Category' },
        createdBy: mockUser
      } as any;

      const mockCreatedNotification = {
        id: 1,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        user: mockUser,
        report: mockReport,
        seen: false,
        createdAt: new Date()
      } as any;

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(mockUser)
      };

      // @ts-ignore
      service['reportRepo'] = {
        findReportById: jest.fn().mockResolvedValue(mockReport)
      };

      // @ts-ignore
      service['notificationRepo'] = {
        createNotification: jest.fn().mockResolvedValue(mockCreatedNotification)
      };

      const newNotification: NewNotificationDTO = {
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        userId: 5,
        reportId: 15
      };

      const result = await service.createNotification(newNotification);

      expect((service as any).userRepo.findUserById).toHaveBeenCalledWith(5);
      expect((service as any).reportRepo.findReportById).toHaveBeenCalledWith(15);
      expect((service as any).notificationRepo.createNotification).toHaveBeenCalledTimes(1);
      
      const createdArg = ((service as any).notificationRepo.createNotification as jest.Mock).mock.calls[0][0];
      expect(createdArg).toMatchObject({
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        user: mockUser,
        report: mockReport
      });

      expect(result).toMatchObject({
        id: 1,
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned
      });
    });

    it('should throw BadRequestError when user does not exist', async () => {
      const service = new NotificationService();

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(null)
      };

      const newNotification: NewNotificationDTO = {
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        userId: 999,
        reportId: 15
      };

      await expect(service.createNotification(newNotification)).rejects.toThrow('User not found');
      expect((service as any).userRepo.findUserById).toHaveBeenCalledTimes(1);
      expect((service as any).userRepo.findUserById).toHaveBeenCalledWith(999);
    });

    it('should throw BadRequestError when report does not exist', async () => {
      const service = new NotificationService();

      const mockUser = { id: 5, username: 'testuser' } as any;

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(mockUser)
      };

      // @ts-ignore
      service['reportRepo'] = {
        findReportById: jest.fn().mockResolvedValue(null)
      };

      const newNotification: NewNotificationDTO = {
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        userId: 5,
        reportId: 888
      };

      await expect(service.createNotification(newNotification)).rejects.toThrow('Report not found');
      expect((service as any).userRepo.findUserById).toHaveBeenCalledTimes(1);
      expect((service as any).userRepo.findUserById).toHaveBeenCalledWith(5);
      expect((service as any).reportRepo.findReportById).toHaveBeenCalledTimes(1);
      expect((service as any).reportRepo.findReportById).toHaveBeenCalledWith(888);
    });

    it('should create notification with different status transitions', async () => {
      const service = new NotificationService();

      const mockUser = { id: 10, username: 'staff' } as any;
      const mockReport = { 
        id: 25, 
        title: 'Report',
        category: { id: 3, name: 'Category' },
        createdBy: mockUser
      } as any;

      const mockCreatedNotification = {
        id: 2,
        previousStatus: ReportStatus.InProgress,
        newStatus: ReportStatus.Resolved,
        user: mockUser,
        report: mockReport,
        seen: false,
        createdAt: new Date()
      } as any;

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(mockUser)
      };

      // @ts-ignore
      service['reportRepo'] = {
        findReportById: jest.fn().mockResolvedValue(mockReport)
      };

      // @ts-ignore
      service['notificationRepo'] = {
        createNotification: jest.fn().mockResolvedValue(mockCreatedNotification)
      };

      const newNotification: NewNotificationDTO = {
        previousStatus: ReportStatus.InProgress,
        newStatus: ReportStatus.Resolved,
        userId: 10,
        reportId: 25
      };

      const result = await service.createNotification(newNotification);

      expect((service as any).userRepo.findUserById).toHaveBeenCalledWith(10);
      expect((service as any).reportRepo.findReportById).toHaveBeenCalledWith(25);
      expect((service as any).notificationRepo.createNotification).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        previousStatus: ReportStatus.InProgress,
        newStatus: ReportStatus.Resolved
      });
    });
  });

  describe('updateNotificationSeen', () => {
    it('should update notification seen status successfully', async () => {
      const service = new NotificationService();

      const mockNotification = {
        id: 7,
        previousStatus: ReportStatus.Assigned,
        newStatus: ReportStatus.InProgress,
        seen: false
      } as any;

      // @ts-ignore
      service['notificationRepo'] = {
        findNotificationById: jest.fn().mockResolvedValue(mockNotification),
        updateNotificationSeen: jest.fn().mockResolvedValue(undefined)
      };

      await service.updateNotificationSeen(7);

      expect((service as any).notificationRepo.findNotificationById).toHaveBeenCalledTimes(1);
      expect((service as any).notificationRepo.findNotificationById).toHaveBeenCalledWith(7);
      expect((service as any).notificationRepo.updateNotificationSeen).toHaveBeenCalledTimes(1);
      expect((service as any).notificationRepo.updateNotificationSeen).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw BadRequestError when notification does not exist', async () => {
      const service = new NotificationService();

      // @ts-ignore
      service['notificationRepo'] = {
        findNotificationById: jest.fn().mockResolvedValue(null)
      };

      await expect(service.updateNotificationSeen(999)).rejects.toThrow('Notification not found');
      expect((service as any).notificationRepo.findNotificationById).toHaveBeenCalledTimes(1);
      expect((service as any).notificationRepo.findNotificationById).toHaveBeenCalledWith(999);
    });

    it('should propagate errors from repository', async () => {
      const service = new NotificationService();

      const mockNotification = { id: 8, seen: false } as any;

      // @ts-ignore
      service['notificationRepo'] = {
        findNotificationById: jest.fn().mockResolvedValue(mockNotification),
        updateNotificationSeen: jest.fn().mockRejectedValue(new Error('update error'))
      };

      await expect(service.updateNotificationSeen(8)).rejects.toThrow('update error');
    });
  });

  describe('findMyNotifications', () => {
    it('should return notifications for specific user', async () => {
      const service = new NotificationService();

      const mockUser = { id: 20, username: 'myuser', email: 'my@test.com' } as any;
      
      const mockNotifications = [
        {
          id: 1,
          previousStatus: ReportStatus.PendingApproval,
          newStatus: ReportStatus.Assigned,
          user: mockUser,
          report: { id: 100, title: 'My Report 1', category: { id: 1 }, createdBy: mockUser },
          seen: false,
          createdAt: new Date('2024-01-03')
        } as any,
        {
          id: 2,
          previousStatus: ReportStatus.Assigned,
          newStatus: ReportStatus.InProgress,
          user: mockUser,
          report: { id: 101, title: 'My Report 2', category: { id: 2 }, createdBy: mockUser },
          seen: true,
          createdAt: new Date('2024-01-02')
        } as any
      ];

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(mockUser)
      };

      // @ts-ignore
      service['notificationRepo'] = {
        findMyNotifications: jest.fn().mockResolvedValue(mockNotifications)
      };

      const result = await service.findMyNotifications(20);

      expect((service as any).userRepo.findUserById).toHaveBeenCalledWith(20);
      expect((service as any).notificationRepo.findMyNotifications).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1, seen: false });
      expect(result[1]).toMatchObject({ id: 2, seen: true });
    });

    it('should throw BadRequestError when user does not exist', async () => {
      const service = new NotificationService();

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(null)
      };

      await expect(service.findMyNotifications(777)).rejects.toThrow('User not found');
      expect((service as any).userRepo.findUserById).toHaveBeenCalledTimes(1);
      expect((service as any).userRepo.findUserById).toHaveBeenCalledWith(777);
    });

    it('should return empty array when user has no notifications', async () => {
      const service = new NotificationService();

      const mockUser = { id: 30, username: 'newuser' } as any;

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(mockUser)
      };

      // @ts-ignore
      service['notificationRepo'] = {
        findMyNotifications: jest.fn().mockResolvedValue([])
      };

      const result = await service.findMyNotifications(30);

      expect((service as any).userRepo.findUserById).toHaveBeenCalledTimes(1);
      expect((service as any).notificationRepo.findMyNotifications).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should propagate errors from repository', async () => {
      const service = new NotificationService();

      const mockUser = { id: 40, username: 'erroruser' } as any;

      // @ts-ignore
      service['userRepo'] = {
        findUserById: jest.fn().mockResolvedValue(mockUser)
      };

      // @ts-ignore
      service['notificationRepo'] = {
        findMyNotifications: jest.fn().mockRejectedValue(new Error('database error'))
      };

      await expect(service.findMyNotifications(40)).rejects.toThrow('database error');
    });
  });
});
