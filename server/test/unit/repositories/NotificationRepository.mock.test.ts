import { NotificationRepository } from '@repositories/NotificationRepository';
import { NotificationDAO } from '@daos/NotificationsDAO';
import { UserDAO } from '@daos/UserDAO';
import { ReportStatus } from '@daos/ReportDAO';

describe('NotificationRepository (mock)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('findAllNotifications should call underlying repo.find with relations', async () => {
    const mockNotifications = [
      { 
        id: 1, 
        previousStatus: ReportStatus.PendingApproval, 
        newStatus: ReportStatus.Assigned,
        user: { id: 1, username: 'user1' },
        report: { id: 1, title: 'Report 1' },
        seen: false,
        createdAt: new Date()
      },
      { 
        id: 2, 
        previousStatus: ReportStatus.Assigned, 
        newStatus: ReportStatus.InProgress,
        user: { id: 2, username: 'user2' },
        report: { id: 2, title: 'Report 2' },
        seen: true,
        createdAt: new Date()
      }
    ];

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue(mockNotifications),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();
    const result = await repo.findAllNotifications();

    expect(fakeRepo.find).toHaveBeenCalledTimes(1);
    expect(fakeRepo.find).toHaveBeenCalledWith({
      relations: ['user', 'report', 'report.category', 'report.createdBy', 'message', 'message.sender']
    });
    expect(result).toHaveLength(2);
    expect(result).toEqual(mockNotifications);
  });

  it('findNotificationById should return notification if found', async () => {
    const mockNotification = { 
      id: 5, 
      previousStatus: ReportStatus.InProgress, 
      newStatus: ReportStatus.Resolved
    };

    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(mockNotification),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();
    const result = await repo.findNotificationById(5);

    expect(fakeRepo.findOne).toHaveBeenCalledTimes(1);
    expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(result).toEqual(mockNotification);
  });

  it('findNotificationById should return null if notification not found', async () => {
    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();
    const result = await repo.findNotificationById(999);

    expect(fakeRepo.findOne).toHaveBeenCalledTimes(1);
    expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    expect(result).toBeNull();
  });

  it('createNotification should save and return notification with relations', async () => {
    const notificationToCreate = {
      previousStatus: ReportStatus.PendingApproval,
      newStatus: ReportStatus.Assigned,
      user: { id: 10, username: 'testuser' } as UserDAO,
      report: { id: 20, title: 'Test Report' } as any,
    } as NotificationDAO;

    const savedNotification = {
      ...notificationToCreate,
      id: 1,
      seen: false,
      createdAt: new Date(),
    };

    const fakeRepo: any = {
      save: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn().mockResolvedValue(savedNotification),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();
    const result = await repo.createNotification(notificationToCreate);

    expect(fakeRepo.save).toHaveBeenCalledTimes(1);
    expect(fakeRepo.save).toHaveBeenCalledWith(notificationToCreate);
    expect(fakeRepo.findOne).toHaveBeenCalledTimes(1);
    expect(fakeRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['user', 'report', 'report.category', 'report.createdBy', 'message', 'message.sender']
    });
    expect(result).toEqual(savedNotification);
  });

  it('createNotification should propagate errors from underlying repo.save', async () => {
    const fakeRepo: any = {
      save: jest.fn().mockRejectedValue(new Error('save failure')),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();

    const notification = { 
      previousStatus: ReportStatus.PendingApproval,
      newStatus: ReportStatus.Assigned 
    } as NotificationDAO;

    await expect(repo.createNotification(notification)).rejects.toThrow('save failure');
  });

  it('updateNotificationSeen should update seen status to true', async () => {
    const notification = {
      id: 3,
      previousStatus: ReportStatus.Assigned,
      newStatus: ReportStatus.InProgress,
      seen: false,
    } as NotificationDAO;

    const fakeRepo: any = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();
    await repo.updateNotificationSeen(notification);

    expect(fakeRepo.update).toHaveBeenCalledTimes(1);
    expect(fakeRepo.update).toHaveBeenCalledWith({ id: 3 }, { seen: true });
  });

  it('findMyNotifications should return notifications for specific user ordered by createdAt DESC', async () => {
    const user = { id: 42, username: 'testuser' } as UserDAO;
    
    const mockNotifications = [
      { 
        id: 3, 
        previousStatus: ReportStatus.InProgress,
        newStatus: ReportStatus.Resolved,
        user: user,
        report: { id: 30, title: 'Report 30' },
        seen: false,
        createdAt: new Date('2024-01-03')
      },
      { 
        id: 1, 
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        user: user,
        report: { id: 10, title: 'Report 10' },
        seen: true,
        createdAt: new Date('2024-01-01')
      },
      { 
        id: 2, 
        previousStatus: ReportStatus.Assigned,
        newStatus: ReportStatus.InProgress,
        user: user,
        report: { id: 20, title: 'Report 20' },
        seen: false,
        createdAt: new Date('2024-01-02')
      }
    ];

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue(mockNotifications),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();
    const result = await repo.findMyNotifications(user);

    expect(fakeRepo.find).toHaveBeenCalledTimes(1);
    expect(fakeRepo.find).toHaveBeenCalledWith({
      where: { user: { id: 42 } },
      relations: ['user', 'report', 'report.category', 'report.createdBy', 'message', 'message.sender'],
      order: { createdAt: 'DESC' }
    });
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockNotifications);
  });

  it('findMyNotifications should return empty array if no notifications found', async () => {
    const user = { id: 100, username: 'newuser' } as UserDAO;

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue([]),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new NotificationRepository();
    const result = await repo.findMyNotifications(user);

    expect(fakeRepo.find).toHaveBeenCalledTimes(1);
    expect(fakeRepo.find).toHaveBeenCalledWith({
      where: { user: { id: 100 } },
      relations: ['user', 'report', 'report.category', 'report.createdBy', 'message', 'message.sender'],
      order: { createdAt: 'DESC' }
    });
    expect(result).toEqual([]);
  });
});
