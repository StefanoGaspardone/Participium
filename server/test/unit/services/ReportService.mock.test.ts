import { ReportService } from '@services/ReportService';
import { ReportStatus, ReportDAO } from '@daos/ReportDAO';
import { CreateReportDTO } from '@dtos/ReportDTO';

describe('ReportService (mock)', () => {
  it('should throw NotFoundError when category does not exist', async () => {
    const service = new ReportService();

    // @ts-ignore
    service['categoryRepo'] = { findCategoryById: jest.fn().mockResolvedValue(undefined) };
    // @ts-ignore
    service['reportRepo'] = { createReport: jest.fn() };

    const inputData: CreateReportDTO = {
      title: '  title  ',
      description: ' desc ',
      categoryId: 42,
      images: [' img1 ', 'img2'],
      lat: 1.23,
      long: 4.56,
      anonymous: false,
    } as CreateReportDTO;

    await expect(service.createReport(10, inputData)).rejects.toThrow(`Category ${inputData.categoryId} not found`);
  });

  it('should create a report when category exists and call createReport with trimmed fields', async () => {
    const service = new ReportService();

    const fakeCategory = { id: 7, name: 'Cat' };
    const mockReportDAO = {
      id: 1,
      title: 'My Title',
      description: 'Some description',
      category: fakeCategory,
      images: ['one', 'two'],
      lat: 12.34,
      long: 56.78,
      status: ReportStatus.PendingApproval,
      anonymous: true,
      createdBy: { id: 123 },
      createdAt: new Date(),
    };
    const createReportMock = jest.fn().mockResolvedValue(mockReportDAO);

    // inject mocks
    // @ts-ignore
    service['categoryRepo'] = { findCategoryById: jest.fn().mockResolvedValue(fakeCategory) };
    // @ts-ignore
    service['reportRepo'] = { createReport: createReportMock };

    const inputData: CreateReportDTO = {
      title: '  My Title  ',
      description: '  Some description  ',
      categoryId: 7,
      images: [' one ', 'two '],
      lat: 12.34,
      long: 56.78,
      anonymous: true,
    } as CreateReportDTO;

    const userId = 123;

    await service.createReport(userId, inputData);

    expect((service as any).categoryRepo.findCategoryById).toHaveBeenCalledWith(inputData.categoryId);
    expect(createReportMock).toHaveBeenCalledTimes(1);

  const createdArg: ReportDAO = createReportMock.mock.calls[0][0] as ReportDAO;
    expect(createdArg.title).toBe(inputData.title.trim());
    expect(createdArg.description).toBe(inputData.description.trim());
    expect(createdArg.images).toEqual(inputData.images.map((i: string) => i.trim()));
    expect(createdArg.createdBy).toBeDefined();
    expect(createdArg.createdBy.id).toBe(userId);
    expect(createdArg.status).toBe(ReportStatus.PendingApproval);
    expect(createdArg.anonymous).toBe(true);
    expect(createdArg.createdAt).toBeInstanceOf(Date);
  });

  describe('listReportsByStatus', () => {
    it('should return a list of reports', async () => {
      const service = new ReportService();
      const mockReports = [
        { id: 1, title: 'R1', status: ReportStatus.PendingApproval, createdBy: { id: 1 }, category: { id: 1, name: 'C1' }, createdAt: new Date() },
        { id: 2, title: 'R2', status: ReportStatus.PendingApproval, createdBy: { id: 2 }, category: { id: 2, name: 'C2' }, createdAt: new Date() }
      ];

      // @ts-ignore
      service['reportRepo'] = { findReportsByStatus: jest.fn().mockResolvedValue(mockReports) };

      const result = await service.listReportsByStatus(ReportStatus.PendingApproval);

      expect((service as any).reportRepo.findReportsByStatus).toHaveBeenCalledWith(ReportStatus.PendingApproval);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('updateReportCategory', () => {
    it('should throw NotFoundError if report not found', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(null) };

      await expect(service.updateReportCategory(1, 1)).rejects.toThrow('Report 1 not found');
    });

    it('should throw NotFoundError if category not found', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue({ id: 1 }) };
      // @ts-ignore
      service['categoryRepo'] = { findCategoryById: jest.fn().mockResolvedValue(null) };

      await expect(service.updateReportCategory(1, 1)).rejects.toThrow('Category 1 not found');
    });

    it('should update category and return DTO', async () => {
      const service = new ReportService();
      const mockReport = { id: 1, title: 'R1', category: { id: 1 }, createdBy: { id: 1 }, createdAt: new Date() };
      const mockCategory = { id: 2, name: 'New Cat' };

      // @ts-ignore
      service['reportRepo'] = { 
        findReportById: jest.fn().mockResolvedValue(mockReport),
        save: jest.fn().mockImplementation(async (r) => r)
      };
      // @ts-ignore
      service['categoryRepo'] = { findCategoryById: jest.fn().mockResolvedValue(mockCategory) };

      const result = await service.updateReportCategory(1, 2);

      expect((service as any).reportRepo.save).toHaveBeenCalled();
      expect(result.category.id).toBe(2);
      expect(result.category.name).toBe('New Cat');
    });
  });

  describe('assignOrRejectReport', () => {
    it('should throw NotFoundError if report not found', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(null) };

      await expect(service.assignOrRejectReport(1, ReportStatus.Assigned)).rejects.toThrow('Report 1 not found');
    });

    it('should throw BadRequestError if report is not PendingApproval', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue({ id: 1, status: ReportStatus.Assigned }) };

      await expect(service.assignOrRejectReport(1, ReportStatus.Assigned)).rejects.toThrow('Only reports in PendingApproval can be accepted or rejected');
    });

    it('should throw BadRequestError if assigning but no office', async () => {
      const service = new ReportService();
      const mockReport = { id: 1, status: ReportStatus.PendingApproval, category: {} };
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport) };

      await expect(service.assignOrRejectReport(1, ReportStatus.Assigned)).rejects.toThrow('Report category has no associated office');
    });

    it('should throw BadRequestError if assigning but no staff available', async () => {
      const service = new ReportService();
      const mockReport = { id: 1, status: ReportStatus.PendingApproval, category: { office: { id: 1 } } };
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport) };
      // @ts-ignore
      service['userRepo'] = { findLeastLoadedStaffForOffice: jest.fn().mockResolvedValue(null) };

      await expect(service.assignOrRejectReport(1, ReportStatus.Assigned)).rejects.toThrow('No technical staff member available for this office');
    });

    it('should assign report to staff', async () => {
      const service = new ReportService();
      const mockReport = { 
        id: 1, 
        status: ReportStatus.PendingApproval, 
        category: { office: { id: 1 } },
        createdBy: { id: 10 },
        createdAt: new Date()
      };
      const mockStaff = { id: 99, username: 'staff' };

      // @ts-ignore
      service['reportRepo'] = { 
        findReportById: jest.fn().mockResolvedValue(mockReport),
        save: jest.fn().mockImplementation(async (r) => r)
      };
      // @ts-ignore
      service['userRepo'] = { findLeastLoadedStaffForOffice: jest.fn().mockResolvedValue(mockStaff) };
      // @ts-ignore
      service['notificationService'] = { createNotification: jest.fn() };

      const result = await service.assignOrRejectReport(1, ReportStatus.Assigned);

      expect((service as any).reportRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(ReportStatus.Assigned);
      expect((service as any).notificationService.createNotification).toHaveBeenCalled();
    });

    it('should throw BadRequestError if rejecting without description', async () => {
      const service = new ReportService();
      const mockReport = { id: 1, status: ReportStatus.PendingApproval };
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport) };

      await expect(service.assignOrRejectReport(1, ReportStatus.Rejected)).rejects.toThrow('Validation failed');
    });

    it('should reject report', async () => {
      const service = new ReportService();
      const mockReport = { 
        id: 1, 
        status: ReportStatus.PendingApproval,
        createdBy: { id: 10 },
        category: { id: 1, name: 'C1' },
        createdAt: new Date()
      };

      // @ts-ignore
      service['reportRepo'] = { 
        findReportById: jest.fn().mockResolvedValue(mockReport),
        save: jest.fn().mockImplementation(async (r) => r)
      };
      // @ts-ignore
      service['notificationService'] = { createNotification: jest.fn() };

      const result = await service.assignOrRejectReport(1, ReportStatus.Rejected, 'Bad report');

      expect((service as any).reportRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(ReportStatus.Rejected);
      expect(result.rejectedDescription).toBe('Bad report');
      expect((service as any).notificationService.createNotification).toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid status transition', async () => {
      const service = new ReportService();
      const mockReport = { id: 1, status: ReportStatus.PendingApproval };
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport) };

      await expect(service.assignOrRejectReport(1, ReportStatus.Resolved)).rejects.toThrow('Invalid status transition. Allowed: Assigned or Rejected');
    });
  });

  describe('listAssignedReports', () => {
    it('should return empty array when no reports assigned', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportsAssignedTo: jest.fn().mockResolvedValue([]) };

      const result = await service.listAssignedReports(123);

      expect((service as any).reportRepo.findReportsAssignedTo).toHaveBeenCalledWith(123);
      expect(result).toHaveLength(0);
    });

    it('should return list of assigned reports for a user', async () => {
      const service = new ReportService();
      const mockReports = [
        {
          id: 1,
          title: 'Report 1',
          status: ReportStatus.Assigned,
          createdBy: { id: 10, username: 'citizen' },
          assignedTo: { id: 123, username: 'tech' },
          category: { id: 1, name: 'Potholes' },
          createdAt: new Date(),
          lat: 45.07,
          long: 7.65
        },
        {
          id: 2,
          title: 'Report 2',
          status: ReportStatus.InProgress,
          createdBy: { id: 11, username: 'citizen2' },
          assignedTo: { id: 123, username: 'tech' },
          category: { id: 2, name: 'Lights' },
          createdAt: new Date(),
          lat: 45.08,
          long: 7.66
        }
      ];

      // @ts-ignore
      service['reportRepo'] = { findReportsAssignedTo: jest.fn().mockResolvedValue(mockReports) };

      const result = await service.listAssignedReports(123);

      expect((service as any).reportRepo.findReportsAssignedTo).toHaveBeenCalledWith(123);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe('Report 1');
      expect(result[0].status).toBe(ReportStatus.Assigned);
      expect(result[1].id).toBe(2);
      expect(result[1].status).toBe(ReportStatus.InProgress);
    });

    it('should map reports to DTOs correctly', async () => {
      const service = new ReportService();
      const mockReport = {
        id: 5,
        title: 'Street Light Broken',
        description: 'Light is out',
        status: ReportStatus.Assigned,
        createdBy: { id: 50, username: 'user50', firstName: 'John', lastName: 'Doe' },
        assignedTo: { id: 99, username: 'tech99', firstName: 'Tech', lastName: 'Staff' },
        category: { id: 3, name: 'Street Lights', office: { id: 1, name: 'Office 1' } },
        images: ['http://img/1.jpg'],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
        createdAt: new Date('2025-01-01'),
        rejectedDescription: null
      };

      // @ts-ignore
      service['reportRepo'] = { findReportsAssignedTo: jest.fn().mockResolvedValue([mockReport]) };

      const result = await service.listAssignedReports(99);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 5);
      expect(result[0]).toHaveProperty('title', 'Street Light Broken');
      expect(result[0]).toHaveProperty('description', 'Light is out');
      expect(result[0]).toHaveProperty('category');
      expect(result[0].category).toHaveProperty('name', 'Street Lights');
      expect(result[0]).toHaveProperty('assignedTo');
      expect(result[0].assignedTo).toBeDefined();
      if (result[0].assignedTo) {
        expect(result[0].assignedTo.username).toBe('tech99');
      }
    });
  });

  describe('updateReportStatus', () => {
    it('should throw NotFoundError if report not found', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(null) };

      await expect(service.updateReportStatus(1, ReportStatus.InProgress)).rejects.toThrow('Report 1 not found');
    });

    it('should throw BadRequestError if trying to change status of resolved report', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue({ status: ReportStatus.Resolved }) };

      await expect(service.updateReportStatus(1, ReportStatus.Assigned)).rejects.toThrow('Resolved reports cannot change status');
    });

    it('should throw BadRequestError for invalid Assigned->Resolved transition', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue({ status: ReportStatus.Assigned }) };

      await expect(service.updateReportStatus(1, ReportStatus.Resolved)).rejects.toThrow('Invalid status transition. Accepted report con only move to InProgress');
    });

    it('should allow Assigned->InProgress transition', async () => {
      const service = new ReportService();
      const mockReport = { status: ReportStatus.Assigned, createdBy: { id: 10 }, category: { id: 1 } };
      const mockSave = jest.fn().mockImplementation(async (r) => r);
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport), save: mockSave };
      // @ts-ignore
      service['notificationService'] = { createNotification: jest.fn() };

      const result = await service.updateReportStatus(1, ReportStatus.InProgress);

      expect(mockSave).toHaveBeenCalled();
      expect(result.status).toBe(ReportStatus.InProgress);
    });

    it('should throw BadRequestError for invalid InProgress->Assigned transition', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue({ status: ReportStatus.InProgress }) };

      await expect(service.updateReportStatus(1, ReportStatus.Assigned)).rejects.toThrow('Invalid status transition. InProgress report can only move to Resolved or Suspended');
    });

    it('should allow InProgress->Resolved transition', async () => {
      const service = new ReportService();
      const mockReport = { status: ReportStatus.InProgress, createdBy: { id: 10 }, category: { id: 1 } };
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport), save: jest.fn().mockImplementation(async (r) => r) };
      // @ts-ignore
      service['notificationService'] = { createNotification: jest.fn() };

      const result = await service.updateReportStatus(1, ReportStatus.Resolved);

      expect(result.status).toBe(ReportStatus.Resolved);
    });

    it('should allow InProgress->Suspended transition', async () => {
      const service = new ReportService();
      const mockReport = { status: ReportStatus.InProgress, createdBy: { id: 10 }, category: { id: 1 } };
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport), save: jest.fn().mockImplementation(async (r) => r) };
      // @ts-ignore
      service['notificationService'] = { createNotification: jest.fn() };

      const result = await service.updateReportStatus(1, ReportStatus.Suspended);

      expect(result.status).toBe(ReportStatus.Suspended);
    });

    it('should throw BadRequestError for invalid Suspended->Resolved transition', async () => {
      const service = new ReportService();
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue({ status: ReportStatus.Suspended }) };

      await expect(service.updateReportStatus(1, ReportStatus.Resolved)).rejects.toThrow('Invalid status transition. Suspended report can only move to InProgress');
    });

    it('should allow Suspended->InProgress transition', async () => {
      const service = new ReportService();
      const mockReport = { status: ReportStatus.Suspended, createdBy: { id: 10 }, category: { id: 1 } };
      // @ts-ignore
      service['reportRepo'] = { findReportById: jest.fn().mockResolvedValue(mockReport), save: jest.fn().mockImplementation(async (r) => r) };
      // @ts-ignore
      service['notificationService'] = { createNotification: jest.fn() };

      const result = await service.updateReportStatus(1, ReportStatus.InProgress);

      expect(result.status).toBe(ReportStatus.InProgress);
    });
  });
});
