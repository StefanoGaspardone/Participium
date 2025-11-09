import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import * as bcrypt from 'bcryptjs';

let reportController: any;

describe('ReportController integration tests', () => {
  let categoryId: number | undefined;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const roleRepo = AppDataSource.getRepository(OfficeDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);

    const role = roleRepo.create({ name: 'Controller Test Role' });
    await roleRepo.save(role);

    const category = categoryRepo.create({ name: 'Street Light', office: role });
    await categoryRepo.save(category);
    categoryId = category.id;

    const salt = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash('cpass', salt);
    const citizen = userRepo.create({
      username: 'controller_citizen',
      email: 'controller_citizen@gmail.com',
      passwordHash: userHash,
      firstName: 'Ctrl',
      lastName: 'Citizen',
      userType: UserType.CITIZEN,
    });
    await userRepo.save(citizen);

    reportController = (await import('@controllers/ReportController')).reportController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('createReport => valid payload responds 201', async () => {
    const req: any = {
      body: {
        payload: {
          title: 'Lamp broken',
          description: 'Lamp on 3rd street is out',
          categoryId: categoryId,
          images: ['http://img/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      },
      token: { userId: 1, role: UserType.CITIZEN },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await reportController.createReport(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Report successfully created' });
  });

  it('createReport => invalid payload calls next with BadRequestError', async () => {
    const req: any = { body: { payload: { title: 1 } }, token: { userId: 1, role: UserType.CITIZEN } };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.createReport(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
  });

  it('createReport => non-existing category calls next with NotFoundError', async () => {
    const req: any = {
      body: {
        payload: {
          title: 'Missing cat',
          description: 'Category not present',
          categoryId: 999999,
          images: ['http://img/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      },
      token: { userId: 1, role: UserType.CITIZEN },
    };

    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.createReport(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('NotFoundError');
  });
});
