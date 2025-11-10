import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { OfficeDAO } from '@daos/OfficeDAO';

let officeController: any;

describe('OfficeController integration tests', () => {
  let AppDataSource: any;

  beforeAll(async () => {
    AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const officeRepo = AppDataSource.getRepository(OfficeDAO);

    const o1 = officeRepo.create({ name: 'Public Services Division' });
    const o2 = officeRepo.create({ name: 'Infrastructure Division' });
    await officeRepo.save(o1);
    await officeRepo.save(o2);

    // import controller after DB is initialized
    officeController = (await import('@controllers/OfficeController')).officeController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('findAllOffices => should return array of offices', async () => {
    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await officeController.findAllOffices(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(2);
    const names = body.map((b: any) => b.name);
    expect(names).toContain('Public Services Division');
    expect(names).toContain('Infrastructure Division');
  });

  it('findAllOffices => should call next on service error', async () => {
    // temporarily replace service to simulate error
    const originalService = officeController.officeService;
    officeController.officeService = { findAllOffices: jest.fn().mockRejectedValue(new Error('boom')) } as any;

    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await officeController.findAllOffices(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();

    // restore original
    officeController.officeService = originalService;
  });

  it('findAllOffices => returns empty array when no offices exist', async () => {
    // clear DB and ensure no offices exist
    await emptyTestData();

    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await officeController.findAllOffices(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });
});
