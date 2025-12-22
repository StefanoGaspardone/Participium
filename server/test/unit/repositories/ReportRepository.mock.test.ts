import { ReportRepository } from '@repositories/ReportRepository';
import { ReportDAO } from '@daos/ReportDAO';

describe('ReportRepository (mock)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('createReport should call underlying repo.save and return value', async () => {
    const fakeRepo: any = {
      save: jest.fn().mockImplementation(async (r: any) => ({ ...r, id: 1 })),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();

  const r = { title: ' My Report ' } as ReportDAO;
    const saved = await repo.createReport(r);

    expect(fakeRepo.save).toHaveBeenCalledTimes(1);
    expect(saved.id).toBeDefined();
    expect(saved).toEqual(expect.objectContaining({ title: ' My Report ' }));
  });

  it('createReport should propagate errors from underlying repo.save', async () => {
    const fakeRepo: any = {
      save: jest.fn().mockRejectedValue(new Error('save failure')),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();

    const r = { title: 'Bad Save' } as ReportDAO;
    await expect(repo.createReport(r)).rejects.toThrow('save failure');
  });

  it('findReportById should return the report if found', async () => {
    const mockReport = { id: 1, title: 'Found Report' };
    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(mockReport),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportById(1);

    expect(fakeRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ["category", "category.office", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"]
    });
    expect(result).toEqual(mockReport);
  });

  it('findReportById should return null if report not found', async () => {
    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportById(999);

    expect(fakeRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
      relations: ["category", "category.office", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"]
    });
    expect(result).toBeNull();
  });

  it('findReportsByStatus should return filtered reports', async () => {
    const storedReports: ReportDAO[] = [];
    const fakeRepo: any = {
      save: jest.fn().mockImplementation(async (r: ReportDAO) => {
        const newReport = { ...r, id: storedReports.length + 1 };
        storedReports.push(newReport);
        return newReport;
      }),
      find: jest.fn().mockImplementation(async (options: any) => {
        const status = options.where.status;
        return storedReports.filter(r => r.status === status);
      }),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    
    const category = { id: 1, name: 'Infrastructure' } as any;

    const r1 = { title: 'Report 1', status: 'PendingApproval', category } as unknown as ReportDAO;
    const r2 = { title: 'Report 2', status: 'Resolved', category } as unknown as ReportDAO;
    const r3 = { title: 'Report 3', status: 'PendingApproval', category } as unknown as ReportDAO;

    await repo.createReport(r1);
    await repo.createReport(r2);
    await repo.createReport(r3);

    const result = await repo.findReportsByStatus('PendingApproval' as any);

    expect(fakeRepo.find).toHaveBeenCalledWith({
      where: { status: 'PendingApproval' },
      relations: ['category', 'createdBy', 'assignedTo', 'coAssignedTo', 'coAssignedTo.company'],
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Report 1' }),
      expect.objectContaining({ title: 'Report 3' }),
    ]));
  });

  it('findReportsAssignedTo should return reports assigned to a user', async () => {
    const mockReports = [
      { id: 1, title: 'Report 1', assignedTo: { id: 123 }, status: 'Assigned' },
      { id: 2, title: 'Report 2', assignedTo: { id: 123 }, status: 'InProgress' }
    ];

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue(mockReports),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportsAssignedTo(123);

    expect(fakeRepo.find).toHaveBeenCalledWith({
      where: { assignedTo: { id: 123 } },
      relations: ["category", "category.office", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"],
      order: { createdAt: "DESC" }
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({ title: 'Report 1' }));
    expect(result[1]).toEqual(expect.objectContaining({ title: 'Report 2' }));
  });

  it('findReportsAssignedTo should return empty array if no reports assigned', async () => {
    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue([]),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportsAssignedTo(456);

    expect(fakeRepo.find).toHaveBeenCalledWith({
      where: { assignedTo: { id: 456 } },
      relations: ["category", "category.office", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"],
      order: { createdAt: "DESC" }
    });

    expect(result).toHaveLength(0);
  });

  it('findReportsAssignedTo should order reports by createdAt DESC', async () => {
    const mockReports = [
      { id: 2, title: 'Newer Report', createdAt: new Date('2025-01-02'), assignedTo: { id: 123 } },
      { id: 1, title: 'Older Report', createdAt: new Date('2025-01-01'), assignedTo: { id: 123 } }
    ];

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue(mockReports),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportsAssignedTo(123);

    expect(fakeRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      order: { createdAt: "DESC" }
    }));

    expect(result[0].title).toBe('Newer Report');
    expect(result[1].title).toBe('Older Report');
  });

  it('findReportsCoAssignedTo should return reports assigned to an external maintainer', async () => {
      const mockReports = [
            { id: 1, title: 'Report 1', assignedTo: { id: 123 }, status: 'Assigned' },
            { id: 2, title: 'Report 2', assignedTo: { id: 123 }, status: 'InProgress' }
      ];

      const fakeRepo: any = {
          find: jest.fn().mockResolvedValue(mockReports),
      };

      const database = require('@database');
      jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

      const repo = new ReportRepository();
      const result = await repo.findReportsCoAssignedTo(123);

      expect(fakeRepo.find).toHaveBeenCalledWith({
          where: { coAssignedTo: { id: 123 } },
          relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"],
          order: { createdAt: "DESC" }
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ title: 'Report 1' }));
      expect(result[1]).toEqual(expect.objectContaining({ title: 'Report 2' }));
    });

    it('findReportsCoAssignedTo should return empty array if no reports assigned', async () => {
        const fakeRepo: any = {
            find: jest.fn().mockResolvedValue([]),
        };

        const database = require('@database');
        jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

        const repo = new ReportRepository();
        const result = await repo.findReportsCoAssignedTo(456);

        expect(fakeRepo.find).toHaveBeenCalledWith({
            where: { coAssignedTo: { id: 456 } },
            relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"],
            order: { createdAt: "DESC" }
        });

        expect(result).toHaveLength(0);
    });

    it('findReportsCoAssignedTo should order reports by createdAt DESC', async () => {
        const mockReports = [
            { id: 2, title: 'Newer Report', createdAt: new Date('2025-01-02'), assignedTo: { id: 123 } },
            { id: 1, title: 'Older Report', createdAt: new Date('2025-01-01'), assignedTo: { id: 123 } }
        ];

        const fakeRepo: any = {
            find: jest.fn().mockResolvedValue(mockReports),
        };

        const database = require('@database');
        jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

        const repo = new ReportRepository();
        const result = await repo.findReportsCoAssignedTo(123);

        expect(fakeRepo.find).toHaveBeenCalledWith(expect.objectContaining({
            order: { createdAt: "DESC" }
        }));

        expect(result[0].title).toBe('Newer Report');
        expect(result[1].title).toBe('Older Report');
    });

  it('findReportsByUserId should return reports created by a user', async () => {
    const mockReports = [
      { id: 1, title: 'User Report 1', createdBy: { id: 100 }, status: 'PendingApproval' },
      { id: 2, title: 'User Report 2', createdBy: { id: 100 }, status: 'Assigned' }
    ];

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue(mockReports),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportsByUserId(100);

    expect(fakeRepo.find).toHaveBeenCalledWith({
      where: { createdBy: { id: 100 } },
      relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"]
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({ title: 'User Report 1' }));
    expect(result[1]).toEqual(expect.objectContaining({ title: 'User Report 2' }));
  });

  it('findReportsByUserId should return empty array if user has no reports', async () => {
    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue([]),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportsByUserId(999);

    expect(fakeRepo.find).toHaveBeenCalledWith({
      where: { createdBy: { id: 999 } },
      relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"]
    });

    expect(result).toHaveLength(0);
  });

  it('findReportsByUserId should return reports with all relations loaded', async () => {
    const mockReports = [
      {
        id: 1,
        title: 'Detailed Report',
        createdBy: { id: 50, username: 'user50' },
        category: { id: 1, name: 'Roads' },
        assignedTo: { id: 20, username: 'tech20' },
        coAssignedTo: { id: 30, username: 'external30', company: { id: 5, name: 'Company A' } },
        status: 'InProgress'
      }
    ];

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue(mockReports),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportsByUserId(50);

    expect(fakeRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      relations: ["category", "createdBy", "assignedTo", "coAssignedTo", "coAssignedTo.company"]
    }));

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeDefined();
    expect(result[0].createdBy).toBeDefined();
    expect(result[0].assignedTo).toBeDefined();
    expect(result[0].coAssignedTo).toBeDefined();
    expect(result[0].coAssignedTo.company).toBeDefined();
  });

  it('findReportsByUserId should handle multiple reports with different statuses', async () => {
    const mockReports = [
      { id: 1, title: 'Pending Report', createdBy: { id: 75 }, status: 'PendingApproval' },
      { id: 2, title: 'Assigned Report', createdBy: { id: 75 }, status: 'Assigned' },
      { id: 3, title: 'Resolved Report', createdBy: { id: 75 }, status: 'Resolved' },
      { id: 4, title: 'Rejected Report', createdBy: { id: 75 }, status: 'Rejected' }
    ];

    const fakeRepo: any = {
      find: jest.fn().mockResolvedValue(mockReports),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();
    const result = await repo.findReportsByUserId(75);

    expect(result).toHaveLength(4);
    expect(result.map(r => r.status)).toEqual(['PendingApproval', 'Assigned', 'Resolved', 'Rejected']);
  });
});

