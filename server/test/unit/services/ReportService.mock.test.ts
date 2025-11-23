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
});
