import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';

let categoryController: any;

describe('CategoryController integration tests', () => {
  let AppDataSource: any;

  beforeAll(async () => {
    AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const officeRepo = AppDataSource.getRepository(OfficeDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);

    const o1 = officeRepo.create({ name: 'Public Services Division' });
    await officeRepo.save(o1);

    const c1 = categoryRepo.create({ name: 'Water Supply - Drinking Water', office: o1 });
    const c2 = categoryRepo.create({ name: 'Public Lighting', office: o1 });
    await categoryRepo.save(c1);
    await categoryRepo.save(c2);

    // import controller after DB is initialized
    categoryController = (await import('@controllers/CategoryController')).categoryController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('findAllCategories => should return categories wrapped in { categories }', async () => {
    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await categoryController.findAllCategories(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('categories');
    expect(Array.isArray(body.categories)).toBe(true);
    const names = body.categories.map((c: any) => c.name);
    expect(names).toContain('Water Supply - Drinking Water');
    expect(names).toContain('Public Lighting');
  });

  it('findAllCategories => should call next on service error', async () => {
    const originalService = categoryController.categoryService;
    categoryController.categoryService = { findAllCategories: jest.fn().mockRejectedValue(new Error('boom')) } as any;

    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await categoryController.findAllCategories(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();

    categoryController.categoryService = originalService;
  });

//   it('findAllCategories => returns empty array when no categories exist', async () => {
//     // remove all data from DB for this test
//     await emptyTestData();

//     const req: any = {};
//     const res: any = {
//       status: jest.fn().mockReturnThis(),
//       json: jest.fn().mockReturnThis(),
//     };
//     const next = jest.fn();

//     await categoryController.findAllCategories(req, res, next);

//     expect(next).not.toHaveBeenCalled();
//     expect(res.status).toHaveBeenCalledWith(200);
//     const body = res.json.mock.calls[0][0];
//     expect(body).toHaveProperty('categories');
//     expect(Array.isArray(body.categories)).toBe(true);
//     expect(body.categories.length).toBe(0);
//   });
});
