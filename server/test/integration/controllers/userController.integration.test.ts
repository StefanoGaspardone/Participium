import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import * as bcrypt from 'bcryptjs';

// Test password constants
const TEST_PASSWORD_ADMIN = 'admin'; //NOSONAR
const TEST_PASSWORD_USER = 'user'; //NOSONAR
const TEST_PASSWORD_GENERIC = 'password'; //NOSONAR
const TEST_PASSWORD_ME = 'metest'; //NOSONAR
const TEST_PASSWORD_TEST_USER = 'testuser'; //NOSONAR
const TEST_PASSWORD_PASS = 'pass'; //NOSONAR
const TEST_PASSWORD_EXT = 'extpass'; //NOSONAR

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
    const adminHash = await bcrypt.hash(TEST_PASSWORD_ADMIN, salt1);
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
    const userHash = await bcrypt.hash(TEST_PASSWORD_USER, salt2);
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
        password: 'password', //NOSONAR
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
      send: jest.fn().mockReturnThis(),
    };

    const next = jest.fn();

    await userController.signUpUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();
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
        password: 'password', //NOSONAR
        firstName: 'False',
        lastName: 'Test',
        username: 'falsetest',
        emailNotificationsEnabled: false, // Explicitly test false value
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const next = jest.fn();

    await userController.signUpUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();

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
        password: 'password', //NOSONAR
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
        password: 'password', //NOSONAR
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
        password: 'password', //NOSONAR
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
        password: 'password', //NOSONAR
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
        password: 'password', //NOSONAR
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
        password: 'password', //NOSONAR
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

  it('findUserByTelegramUsername => should return user when telegram username exists', async () => {
    const req: any = {
      params: { telegramUsername: '@testuser' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    // Create a user with telegram username
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_PASS, salt);
    const telegramUser = userRepo.create({
      username: 'tguser',
      email: 'tg@gmail.com',
      passwordHash: hash,
      firstName: 'Telegram',
      lastName: 'User',
      userType: UserType.CITIZEN,
      telegramUsername: '@testuser',
      emailNotificationsEnabled: false,
    });
    await userRepo.save(telegramUser);

    await userController.findUserByTelegramUsername(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];
    expect(response.user).toBeDefined();
    expect(response.user.telegramUsername).toBe('@testuser');
  });

  it('findUserByTelegramUsername => should call next with NotFoundError when user does not exist', async () => {
    const req: any = {
      params: { telegramUsername: '@nonexistent' },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.findUserByTelegramUsername(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('NotFoundError');
  });

  it('findUserByTelegramUsername => should call next with BadRequestError for invalid telegram username', async () => {
    const req: any = {
      params: { telegramUsername: 'invalid' },
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.findUserByTelegramUsername(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/not a valid telegram username/);
  });
});

describe('UserController.me integration tests', () => {
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const userRepo = AppDataSource.getRepository(UserDAO);

    const salt = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash(TEST_PASSWORD_ME, salt);
    const testUser = userRepo.create({
      username: 'metest',
      email: 'me@test.com',
      passwordHash: userHash,
      firstName: 'Me',
      lastName: 'Test',
      userType: UserType.CITIZEN,
      emailNotificationsEnabled: false,
    });
    const savedUser = await userRepo.save(testUser);
    testUserId = savedUser.id;

    // Login to get a real token
    const jwt = require('jsonwebtoken');
    const { CONFIG } = await import('@config');
    const { MapUserDAOtoDTO } = await import('@dtos/UserDTO');
    const userDto = MapUserDAOtoDTO(savedUser);
    testToken = jwt.sign({ user: userDto }, CONFIG.JWT_SECRET, { expiresIn: '1d' });

    userController = (await import('@controllers/UserController')).userController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('me => should return user info and token when authenticated', async () => {
    const jwt = require('jsonwebtoken');
    const { CONFIG } = await import('@config');
    const decoded = jwt.verify(testToken, CONFIG.JWT_SECRET);

    const req: any = {
      token: decoded,
      headers: {
        authorization: `Bearer ${testToken}`,
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.me(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];
    expect(response.message).toBe('Login successful');
    expect(response.token).toBeDefined();
  });

  it('me => should call next with UnauthorizedError when no token provided', async () => {
    const req: any = {
      token: null,
      headers: {},
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.me(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('UnauthorizedError');
  });

  it('me => should call next with UnauthorizedError when token has no user', async () => {
    const req: any = {
      token: { someData: 'invalid' },
      headers: {},
    };

    const res: any = {
      status: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await userController.me(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('UnauthorizedError');
  });
});

describe('UserController.updateUser integration tests', () => {
  let testUserId: number;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const userRepo = AppDataSource.getRepository(UserDAO);

    const salt = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash(TEST_PASSWORD_TEST_USER, salt);
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
    const hash = await bcrypt.hash(TEST_PASSWORD_PASS, salt);
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

describe('UserController.validateUser integration tests', () => {
  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    userController = (await import('@controllers/UserController')).userController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('validateUser => should return 400 when payload is missing', async () => {
    const req: any = {
      body: {},
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/Payload is missing/i);
  });

  it('validateUser => should return 400 when username is missing', async () => {
    const req: any = {
      body: {
        payload: { code: '123456' },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/username.*missing/i);
  });

  it('validateUser => should return 400 when code is missing', async () => {
    const req: any = {
      body: {
        payload: { username: 'testuser' },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/code.*missing/i);
  });

  it('validateUser => should return 404 when user does not exist', async () => {
    const req: any = {
      body: {
        payload: { username: 'nonexistent_user', code: '123456' },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('NotFoundError');
  });

  it('validateUser => should return 400 when user is already active', async () => {
    // Create an active user
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const activeUser = userRepo.create({
      username: 'active_user',
      email: 'active@test.com',
      passwordHash: hash,
      firstName: 'Active',
      lastName: 'User',
      userType: UserType.CITIZEN,
      isActive: true,
      emailNotificationsEnabled: false,
    });
    await userRepo.save(activeUser);

    const req: any = {
      body: {
        payload: { username: 'active_user', code: '123456' },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/already active/i);
  });

  it('validateUser => should return 400 when no verification code found for user', async () => {
    // Create an inactive user without verification code
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const inactiveUser = userRepo.create({
      username: 'no_code_user',
      email: 'nocode@test.com',
      passwordHash: hash,
      firstName: 'NoCode',
      lastName: 'User',
      userType: UserType.CITIZEN,
      isActive: false,
      emailNotificationsEnabled: false,
    });
    await userRepo.save(inactiveUser);

    const req: any = {
      body: {
        payload: { username: 'no_code_user', code: '123456' },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/No verification code found/i);
  });

  it('validateUser => should return 400 when verification code has expired', async () => {
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const { CodeConfirmationDAO } = await import('@daos/CodeConfirmationDAO');
    const codeRepo = AppDataSource.getRepository(CodeConfirmationDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const user = userRepo.create({
      username: 'expired_user',
      email: 'expired@test.com',
      passwordHash: hash,
      firstName: 'Expired',
      lastName: 'User',
      userType: UserType.CITIZEN,
      isActive: false,
      emailNotificationsEnabled: false,
    });
    const savedUser = await userRepo.save(user);

    // Create expired code (1 hour ago)
    const expiredDate = new Date(Date.now() - 60 * 60 * 1000);
    const code = codeRepo.create({
      code: '123456',
      expirationDate: expiredDate,
      user: savedUser,
    });
    await codeRepo.save(code);

    const req: any = {
      body: {
        payload: { username: 'expired_user', code: '123456' },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/expired/i);
  });

  it('validateUser => should return 400 when verification code is invalid', async () => {
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const { CodeConfirmationDAO } = await import('@daos/CodeConfirmationDAO');
    const codeRepo = AppDataSource.getRepository(CodeConfirmationDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const user = userRepo.create({
      username: 'invalid_code_user',
      email: 'invalidcode@test.com',
      passwordHash: hash,
      firstName: 'Invalid',
      lastName: 'User',
      userType: UserType.CITIZEN,
      isActive: false,
      emailNotificationsEnabled: false,
    });
    const savedUser = await userRepo.save(user);

    // Create valid code
    const futureDate = new Date(Date.now() + 30 * 60 * 1000);
    const code = codeRepo.create({
      code: '123456',
      expirationDate: futureDate,
      user: savedUser,
    });
    await codeRepo.save(code);

    const req: any = {
      body: {
        payload: { username: 'invalid_code_user', code: '999999' }, // Wrong code
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/Invalid verification code/i);
  });

  it('validateUser => should successfully validate user and activate account', async () => {
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const { CodeConfirmationDAO } = await import('@daos/CodeConfirmationDAO');
    const codeRepo = AppDataSource.getRepository(CodeConfirmationDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const user = userRepo.create({
      username: 'valid_user',
      email: 'valid@test.com',
      passwordHash: hash,
      firstName: 'Valid',
      lastName: 'User',
      userType: UserType.CITIZEN,
      isActive: false,
      emailNotificationsEnabled: false,
    });
    const savedUser = await userRepo.save(user);

    // Create valid code
    const futureDate = new Date(Date.now() + 30 * 60 * 1000);
    const code = codeRepo.create({
      code: '654321',
      expirationDate: futureDate,
      user: savedUser,
    });
    await codeRepo.save(code);

    const req: any = {
      body: {
        payload: { username: 'valid_user', code: '654321' },
      },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.validateUser(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();

    // Verify user is now active
    const updatedUser = await userRepo.findOne({
      where: { username: 'valid_user' },
      relations: ['codeConfirmation']
    });
    expect(updatedUser?.isActive).toBe(true);
    expect(updatedUser?.codeConfirmation).toBeNull();
  });
});

describe('UserController.resendCode integration tests', () => {
  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    userController = (await import('@controllers/UserController')).userController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('resendCode => should return 400 when username is missing', async () => {
    const req: any = {
      body: {},
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.resendCode(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/username.*missing/i);
  });

  it('resendCode => should return 400 when username is empty', async () => {
    const req: any = {
      body: { username: '' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.resendCode(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/username.*missing/i);
  });

  it('resendCode => should return 404 when user does not exist', async () => {
    const req: any = {
      body: { username: 'nonexistent_resend_user' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.resendCode(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('NotFoundError');
  });

  it('resendCode => should return 400 when user is already active', async () => {
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const activeUser = userRepo.create({
      username: 'active_resend_user',
      email: 'active_resend@test.com',
      passwordHash: hash,
      firstName: 'Active',
      lastName: 'ResendUser',
      userType: UserType.CITIZEN,
      isActive: true,
      emailNotificationsEnabled: false,
    });
    await userRepo.save(activeUser);

    const req: any = {
      body: { username: 'active_resend_user' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.resendCode(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toMatch(/already active/i);
  });

  it('resendCode => should successfully resend verification code', async () => {
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const { CodeConfirmationDAO } = await import('@daos/CodeConfirmationDAO');
    const codeRepo = AppDataSource.getRepository(CodeConfirmationDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const user = userRepo.create({
      username: 'resend_user',
      email: 'resend@test.com',
      passwordHash: hash,
      firstName: 'Resend',
      lastName: 'User',
      userType: UserType.CITIZEN,
      isActive: false,
      emailNotificationsEnabled: false,
    });
    await userRepo.save(user);

    const req: any = {
      body: { username: 'resend_user' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.resendCode(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();

    // Verify a new code was created
    const updatedUser = await userRepo.findOne({
      where: { username: 'resend_user' },
      relations: ['codeConfirmation']
    });
    expect(updatedUser?.codeConfirmation).toBeDefined();
    expect(updatedUser?.codeConfirmation?.code).toBeDefined();
    expect(updatedUser?.codeConfirmation?.expirationDate).toBeDefined();
  });

  it('resendCode => should update old verification code with new one', async () => {
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    const { CodeConfirmationDAO } = await import('@daos/CodeConfirmationDAO');
    const codeRepo = AppDataSource.getRepository(CodeConfirmationDAO);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, salt);
    const user = userRepo.create({
      username: 'replace_code_user',
      email: 'replacecode@test.com',
      passwordHash: hash,
      firstName: 'Replace',
      lastName: 'User',
      userType: UserType.CITIZEN,
      isActive: false,
      emailNotificationsEnabled: false,
    });
    const savedUser = await userRepo.save(user);

    // Create initial code
    const oldDate = new Date(Date.now() + 30 * 60 * 1000);
    const oldCode = codeRepo.create({
      code: '111111',
      expirationDate: oldDate,
      user: savedUser,
    });
    const savedOldCode = await codeRepo.save(oldCode);
    const oldCodeId = savedOldCode.id;
    const oldExpirationDate = savedOldCode.expirationDate.getTime();

    const req: any = {
      body: { username: 'replace_code_user' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await userController.resendCode(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);

    // Verify code was updated (same ID but new code and expiration)
    const updatedUser = await userRepo.findOne({
      where: { username: 'replace_code_user' },
      relations: ['codeConfirmation']
    });
    expect(updatedUser?.codeConfirmation).toBeDefined();
    expect(updatedUser?.codeConfirmation?.id).toBe(oldCodeId); // Same ID - code was updated, not replaced
    expect(updatedUser?.codeConfirmation?.code).not.toBe('111111'); // Code should be different
    expect(updatedUser?.codeConfirmation?.expirationDate.getTime()).toBeGreaterThan(oldExpirationDate); // New expiration date
  });

  describe('findMaintainersByCategory', () => {
    let testCategoryId: number;
    let testCategoryId2: number;
    let extMaintainerId: number;
    let extMaintainerId2: number;

    beforeAll(async () => {
      const { AppDataSource } = await import('@database');
      const categoryRepo = AppDataSource.getRepository(await import('@daos/CategoryDAO').then(m => m.CategoryDAO));
      const companyRepo = AppDataSource.getRepository(await import('@daos/CompanyDAO').then(m => m.CompanyDAO));
      const userRepo = AppDataSource.getRepository(UserDAO);
      const officeRepo = AppDataSource.getRepository(OfficeDAO);

      // Create office
      const office = officeRepo.create({ name: 'Maintainers Controller Test Office' });
      await officeRepo.save(office);

      // Create two test categories
      const category1 = categoryRepo.create({
        name: 'Controller Test Category 1',
        office
      });
      const category2 = categoryRepo.create({
        name: 'Controller Test Category 2',
        office
      });
      await categoryRepo.save(category1);
      await categoryRepo.save(category2);
      testCategoryId = category1.id;
      testCategoryId2 = category2.id;

      // Create company with category1
      const company1 = companyRepo.create({
        name: `Controller Test Company 1 ${Date.now()}`,
        categories: [category1]
      });
      const savedCompany1 = await companyRepo.save(company1);

      // Create company with category2
      const company2 = companyRepo.create({
        name: `Controller Test Company 2 ${Date.now()}`,
        categories: [category2]
      });
      const savedCompany2 = await companyRepo.save(company2);

      // Create external maintainer for company1
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(TEST_PASSWORD_EXT, salt);
      const extMaintainer1 = userRepo.create({
        username: 'ext_ctrl_maint_1',
        email: 'extctrl1@test.com',
        passwordHash: hash,
        firstName: 'External',
        lastName: 'Controller1',
        userType: UserType.EXTERNAL_MAINTAINER,
        company: savedCompany1
      });
      const saved1 = await userRepo.save(extMaintainer1);
      extMaintainerId = saved1.id;

      // Create external maintainer for company2
      const extMaintainer2 = userRepo.create({
        username: 'ext_ctrl_maint_2',
        email: 'extctrl2@test.com',
        passwordHash: hash,
        firstName: 'External',
        lastName: 'Controller2',
        userType: UserType.EXTERNAL_MAINTAINER,
        company: savedCompany2
      });
      const saved2 = await userRepo.save(extMaintainer2);
      extMaintainerId2 = saved2.id;
    });

    it('should return maintainers for valid category', async () => {
      const req: any = {
        query: { categoryId: testCategoryId.toString() }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      
      const maintainer = body.find((m: any) => m.id === extMaintainerId);
      expect(maintainer).toBeDefined();
      expect(maintainer.username).toBe('ext_ctrl_maint_1');
      expect(maintainer.userType).toBe(UserType.EXTERNAL_MAINTAINER);
    });

    it('should return empty array when no maintainers for category', async () => {
      const { AppDataSource } = await import('@database');
      const categoryRepo = AppDataSource.getRepository(await import('@daos/CategoryDAO').then(m => m.CategoryDAO));
      const officeRepo = AppDataSource.getRepository(OfficeDAO);

      let office = await officeRepo.findOne({ where: {} });
      if (!office) {
        office = officeRepo.create({ name: 'Empty Category Office' });
        await officeRepo.save(office);
      }
      
      const emptyCategory = categoryRepo.create({
        name: 'Empty Category Controller Test',
        office
      });
      await categoryRepo.save(emptyCategory);

      const req: any = {
        query: { categoryId: emptyCategory.id.toString() }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    it('should call next with BadRequestError when categoryId is missing', async () => {
      const req: any = {
        query: {}
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('BadRequestError');
      expect(error.message).toMatch(/categoryId.*required/i);
    });

    it('should call next with BadRequestError when categoryId is not a number', async () => {
      const req: any = {
        query: { categoryId: 'abc' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('BadRequestError');
      expect(error.message).toMatch(/valid number/i);
    });

    it('should call next with NotFoundError when category does not exist', async () => {
      const req: any = {
        query: { categoryId: '99999' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.name).toBe('NotFoundError');
    });

    it('should not return maintainers from different categories', async () => {
      const req: any = {
        query: { categoryId: testCategoryId.toString() }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(Array.isArray(body)).toBe(true);
      
      // Should find maintainer 1 but not maintainer 2
      const maintainer1 = body.find((m: any) => m.id === extMaintainerId);
      const maintainer2 = body.find((m: any) => m.id === extMaintainerId2);
      expect(maintainer1).toBeDefined();
      expect(maintainer2).toBeUndefined();
    });

    it('should return maintainers without passwordHash', async () => {
      const req: any = {
        query: { categoryId: testCategoryId.toString() }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(Array.isArray(body)).toBe(true);
      
      if (body.length > 0) {
        const maintainer = body[0];
        expect(maintainer).toHaveProperty('id');
        expect(maintainer).toHaveProperty('username');
        expect(maintainer).toHaveProperty('email');
        expect(maintainer).toHaveProperty('firstName');
        expect(maintainer).toHaveProperty('lastName');
        expect(maintainer).toHaveProperty('userType');
        expect(maintainer).not.toHaveProperty('passwordHash');
      }
    });

    it('should call next on service error', async () => {
      const originalService = userController.userService;
      userController.userService = { 
        findMaintainersByCategory: jest.fn().mockRejectedValue(new Error('Database error')) 
      } as any;

      const req: any = {
        query: { categoryId: testCategoryId.toString() }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await userController.findMaintainersByCategory(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Database error');

      userController.userService = originalService;
    });
  });
});

