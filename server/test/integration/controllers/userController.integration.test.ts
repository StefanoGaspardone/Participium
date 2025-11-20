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
      emailNotificationsEnabled: false,
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
      emailNotificationsEnabled: false,
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
        emailNotificationsEnabled: false,
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

  it('signUpUser => accepts emailNotificationsEnabled: false', async () => {
    const req: any = {
      body: {
        email: 'falsetest@example.com',
        password: 'password',
        firstName: 'False',
        lastName: 'Test',
        username: 'falsetest',
        emailNotificationsEnabled: false, // Explicitly test false value
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

    // Verify the value was actually saved correctly in the database
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const savedUser = await userRepo.findOne({ where: { email: 'falsetest@example.com' } });
    
    expect(savedUser).toBeDefined();
    expect(savedUser?.emailNotificationsEnabled).toBe(false);
  });

  it('signUpUser => missing emailNotificationsEnabled should throw BadRequestError', async () => {
    const req: any = {
      body: {
        email: 'missing@example.com',
        password: 'password',
        firstName: 'Missing',
        lastName: 'Field',
        username: 'missingfield',
        // emailNotificationsEnabled is missing
      },
    };

    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await userController.signUpUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/emailNotificationsEnabled/i);
  });

  it('signUpUser => conflict when email already exists should call next with ConflictError', async () => {
    const req: any = {
      body: {
        email: 'user@gmail.com', // created in beforeAll
        password: 'password',
        firstName: 'Dup',
        lastName: 'User',
        username: 'dupuser',
        emailNotificationsEnabled: false,
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

    await userController.createMunicipalityUser(req, res, next);

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

describe('UserController.updateUser integration tests', () => {
  let testUserId: number;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const userRepo = AppDataSource.getRepository(UserDAO);

    const salt = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash('testuser', salt);
    const testUser = userRepo.create({
      username: 'testuser',
      email: 'test@gmail.com',
      passwordHash: userHash,
      firstName: 'Test',
      lastName: 'User',
      userType: UserType.CITIZEN,
      emailNotificationsEnabled: false,
    });
    const savedUser = await userRepo.save(testUser);
    testUserId = savedUser.id;

    userController = (await import('@controllers/UserController')).userController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('updateUser => successfully updates user fields', async () => {
    const req: any = {
      body: {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        email: 'updated@gmail.com',
        username: 'updateduser',
        emailNotificationsEnabled: true,
      },
      token: {
        user: { id: testUserId, username: 'testuser', userType: UserType.CITIZEN },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.updateUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];
    expect(response.message).toBe('User updated successfully');
    expect(response.user.firstName).toBe('UpdatedFirst');
    expect(response.user.lastName).toBe('UpdatedLast');
    expect(response.user.email).toBe('updated@gmail.com');
    expect(response.user.username).toBe('updateduser')
    expect(response.user.emailNotificationsEnabled).toBe(true);
  });

  it('updateUser => fails when trying to update invalid field', async () => {
    const req: any = {
      body: {
        firstName: 'Valid',
        userType: 'ADMINISTRATOR', // invalid field
      },
      token: {
        user: { id: testUserId, username: 'testuser', userType: UserType.CITIZEN },
      },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/cannot be updated/i);
  });

  it('updateUser => fails when trying to set empty field', async () => {
    const req: any = {
      body: {
        firstName: '', // empty field
      },
      token: {
        user: { id: testUserId, username: 'testuser', userType: UserType.CITIZEN },
      },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/cannot be empty/i);
  });

  it('updateUser => successfully updates only provided fields', async () => {
    const req: any = {
      body: {
        telegramUsername: 'newtelegram',
      },
      token: {
        user: { id: testUserId, username: 'testuser', userType: UserType.CITIZEN },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.updateUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.message).toBe('User updated successfully');
    expect(response.user.telegramUsername).toBe('newtelegram');
    // Verify other fields were not changed by this update
    expect(response.user.firstName).toBe('UpdatedFirst');
    expect(response.user.email).toBe('updated@gmail.com');
  });

  it('updateUser => handles conflict when updating to existing email', async () => {
    // Create another user - use the AppDataSource from test setup
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('pass', salt);
    const anotherUser = userRepo.create({
      username: 'another',
      email: 'another@gmail.com',
      passwordHash: hash,
      firstName: 'Another',
      lastName: 'User',
      userType: UserType.CITIZEN,
      emailNotificationsEnabled: false,
    });
    await userRepo.save(anotherUser);

    const req: any = {
      body: {
        email: 'another@gmail.com', // try to use existing email
      },
      token: {
        user: { id: testUserId, username: 'testuser', userType: UserType.CITIZEN },
      },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('ConflictError');
  });
});
