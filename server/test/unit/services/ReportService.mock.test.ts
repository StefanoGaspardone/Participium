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
    const createReportMock = jest.fn().mockResolvedValue(undefined);

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

  
});
