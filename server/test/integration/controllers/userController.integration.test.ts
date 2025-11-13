import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import * as bcrypt from 'bcryptjs';

let userController: any;

describe('UserController integration tests', () => {
  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    // ensure clean DB for this suite and create required test data locally (role + admin + user)
    await emptyTestData();

    // create required test data locally (role + admin + user)
    const roleRepo = AppDataSource.getRepository(OfficeDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);

    const role = roleRepo.create({ name: 'Test Role' });
    await roleRepo.save(role);

    const salt1 = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin', salt1);
    const adminUser = userRepo.create({
      username: 'admin',
      email: 'admin@gmail.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      userType: UserType.ADMINISTRATOR,
    });
    await userRepo.save(adminUser);

    const salt2 = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash('user', salt2);
    const normalUser = userRepo.create({
      username: 'user',
      email: 'user@gmail.com',
      passwordHash: userHash,
      firstName: 'Normal',
      lastName: 'User',
      userType: UserType.CITIZEN,
    });
    await userRepo.save(normalUser);

    // import controller after DB is initialized to avoid module init ordering problems
    userController = (await import('@controllers/UserController')).userController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('signUpUser => creates user and responds 201', async () => {
    const req: any = {
      body: {
        email: 'test1@example.com',
        password: 'password',
        firstName: 'test1',
        lastName: 'Test',
        username: 'test1',
        image: null,
        telegramUsername: null,
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const next = jest.fn();

    await userController.signUpUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'User created' });
  });

  it('signUpUser => missing fields should call next with BadRequestError', async () => {
    const req: any = { body: { email: 'a@b' } };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await userController.signUpUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
  });

  it('signUpUser => conflict when email already exists should call next with ConflictError', async () => {
    const req: any = {
      body: {
        email: 'user@gmail.com', // created in beforeAll
        password: 'password',
        firstName: 'Dup',
        lastName: 'User',
        username: 'dupuser',
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const next = jest.fn();

    await userController.signUpUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('ConflictError');
  });

  it('loginUser => valid credentials returns token', async () => {
    const req: any = { body: { username: 'user', password: 'user' } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.loginUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
  });

  it('loginUser => missing fields should call next with BadRequestError', async () => {
    const req: any = { body: { username: 'user' } }; // missing password
    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.loginUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
  });

  it('createMunicipalityUser => valid fields', async () => {
    const req: any = {
      body: {
        email: 'self_muni2@example.com',
        password: 'password',
        firstName: 'Muni',
        lastName: 'Two',
        username: 'selfmuni2',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        officeId: 1,
      },
      token: { userId: 1, role: UserType.ADMINISTRATOR },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.createMunicipalityUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Municipality user created' });
  })

  it('createMunicipalityUser => missing fields should call next with BadRequestError', async () => {
    const req: any = {
      body: {
        email: 'self_muni2@example.com',
      },
      token: { userId: 1, role: UserType.ADMINISTRATOR },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.createMunicipalityUser(req, res, next);

    expect(next).toHaveBeenCalled();

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
  })

  it('createMunicipality => conflict when email already exists should call next with ConflictError', async () => {
    const req: any = {
      body: {
        email: 'user@gmail.com',
        password: 'password',
        firstName: 'Muni',
        lastName: 'Two',
        username: 'selfmuni2',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        officeId: 1,
      },
      token: { userId: 1, role: UserType.ADMINISTRATOR },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };

    const next = jest.fn();

    await userController.signUpUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('ConflictError');
  })

  it('createMunicpalityUser => missing office id should call next with BadRequestError', async () => {
    const req: any = {
      body: {
        email: 'self_muni2@example.com',
        password: 'password',
        firstName: 'Muni',
        lastName: 'Two',
        username: 'selfmuni2',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
      },
      token: { userId: 1, role: UserType.ADMINISTRATOR },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.createMunicipalityUser(req, res, next);

    expect(next).toHaveBeenCalled();

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
  })

  it('createMunicpalityUser => invalid user type should call next with BadRequestError', async () => {
    const req: any = {
      body: {
        email: 'self_muni2@example.com',
        password: 'password',
        firstName: 'Muni',
        lastName: 'Two',
        username: 'selfmuni2',
        userType: 'UserType1',
      },
      token: { userId: 1, role: UserType.ADMINISTRATOR },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.createMunicipalityUser(req, res, next);

    expect(next).toHaveBeenCalled();

    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
  })
});