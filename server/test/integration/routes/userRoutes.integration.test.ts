import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import * as bcrypt from 'bcryptjs';

describe('User routes integration tests', () => {
  let roleId: number | undefined;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    // ensure clean DB for this suite and create role and users locally
    await emptyTestData();

    const roleRepo = AppDataSource.getRepository(OfficeDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);

    const role = roleRepo.create({ name: 'SelfTest Role' });
    await roleRepo.save(role);
    roleId = role.id;

    const salt1 = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin', salt1);
    const adminUser = userRepo.create({
      username: 'self_admin',
      email: 'self_admin@gmail.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'Self',
      userType: UserType.ADMINISTRATOR,
    });
    await userRepo.save(adminUser);

    const salt2 = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash('user', salt2);
    const normalUser = userRepo.create({
      username: 'self_user',
      email: 'self_user@gmail.com',
      passwordHash: userHash,
      firstName: 'Normal',
      lastName: 'Self',
      userType: UserType.CITIZEN,
    });
    await userRepo.save(normalUser);
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('GET /api/users => 200 and returns users array', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('POST /api/users/signup => 201', async () => {
    const newUser = {
      email: 'self_route1@example.com',
      password: 'password',
      firstName: 'Route',
      lastName: 'Test',
      username: 'selfroute1',
      emailNotificationsEnabled: true,
    };
    const res = await request(app).post('/api/users/signup').send(newUser);
    expect(res.status).toBe(201);
  });

  it('POST /api/users/login => 200 and returns token', async () => {
    const credentials = { username: 'self_user', password: 'user' };
    const res = await request(app).post('/api/users/login').send(credentials);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('POST /api/users/signup => 400 when missing mandatory fields', async () => {
    // send only email to trigger missing fields check in controller
    const payload = { email: 'incomplete@example.com' };
    const res = await request(app).post('/api/users/signup').send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/missing|required/);
  });

  it('POST /api/users/login => 400 when missing mandatory fields', async () => {
    // missing password should return BadRequest
    const payload = { username: 'self_user' };
    const res = await request(app).post('/api/users/login').send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message)).toMatch(/Username and password are required/);
  });

  it('POST /api/users/employees => 401 without token', async () => {
    const payload = {
      email: 'self_muni1@example.com',
      password: 'password',
      firstName: 'Muni',
      lastName: 'One',
      username: 'selfmuni1',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeId: roleId,
    };
    const res = await request(app).post('/api/users/employees').send(payload);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/denied|token/);
  });

  it('POST /api/users/employees => 201 with admin token', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: 'admin' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      email: 'self_muni2@example.com',
      password: 'password',
      firstName: 'Muni',
      lastName: 'Two',
      username: 'selfmuni2',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeId: roleId,
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
  });

  it('POST /api/users/employees => 409 with admin token when email already exists', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: 'admin' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      email: 'self_user@gmail.com', // already exists
      password: 'password',
      firstName: 'Dup',
      lastName: 'User',
      username: 'dupuser',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeId: roleId,
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/users/employees => 400 when office not found for TECHNICAL_STAFF_MEMBER', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: 'admin' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      email: 'no_office@example.com',
      password: 'password',
      firstName: 'NoOffice',
      lastName: 'User',
      username: 'nooffice',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeId: 99999, // non-existing
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/office not found/);
  });

  it('POST /api/users/employees => 400 with admin token when missing mandatory fields', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: 'admin' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    // missing `username` and `userType` should trigger validation error
    const incomplete = {
      email: 'self_muni_missing@example.com',
      password: 'password',
      firstName: 'Muni',
      lastName: 'Missing',
      // username: missing
      // userType: missing
      officeId: roleId,
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(incomplete);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/missing|required/);
  });

  it('POST /api/users/employees => 403 with non-admin token', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_user', password: 'user' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      email: 'self_muni3@example.com',
      password: 'password',
      firstName: 'Muni',
      lastName: 'Three',
      username: 'selfmuni3',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeId: roleId,
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/insufficient|permission/);
  });

  it('GET /api/users/:telegramUsername => 200 when user exists', async () => {
    // Use the already initialized AppDataSource from beforeAll
    const { AppDataSource } = await import('@database');
    const userRepo = AppDataSource.getRepository(UserDAO);
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('tgpass', salt);
    const telegramUser = userRepo.create({
      username: 'tguser123',
      email: 'tguser@test.com',
      passwordHash: hash,
      firstName: 'TG',
      lastName: 'User',
      userType: UserType.CITIZEN,
      telegramUsername: '@tguser123',
      emailNotificationsEnabled: false,
    });
    await userRepo.save(telegramUser);

    const res = await request(app).get('/api/users/@tguser123');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.telegramUsername).toBe('@tguser123');
  });

  it('GET /api/users/:telegramUsername => 404 when user does not exist', async () => {
    const res = await request(app).get('/api/users/@nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET /api/users/:telegramUsername => 400 for invalid telegram username format', async () => {
    const res = await request(app).get('/api/users/invalid');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not a valid telegram username/);
  });

  describe('POST /api/users/validate-user', () => {
    it('=> 400 when payload is missing', async () => {
      const res = await request(app).post('/api/users/validate-user').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Payload is missing/);
    });

    it('=> 400 when username is missing', async () => {
      const res = await request(app).post('/api/users/validate-user').send({
        payload: { code: '123456' }
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/username.*missing/i);
    });

    it('=> 400 when code is missing', async () => {
      const res = await request(app).post('/api/users/validate-user').send({
        payload: { username: 'testuser' }
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/code.*missing/i);
    });

    it('=> 404 when user does not exist', async () => {
      const res = await request(app).post('/api/users/validate-user').send({
        payload: { username: 'nonexistent_user_xyz', code: '123456' }
      });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not found/i);
    });

    it('=> 400 when user is already active', async () => {
      // self_user is already active (created in beforeAll without verification)
      const res = await request(app).post('/api/users/validate-user').send({
        payload: { username: 'self_user', code: '123456' }
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/already active/i);
    });

    it('=> 400 when verification code is invalid', async () => {
      // Create a new user with verification code
      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const codeConfirmationRepo = AppDataSource.getRepository(await import('@daos/CodeConfirmationDAO').then(m => m.CodeConfirmationDAO));

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('testpass', salt);
      const newUser = userRepo.create({
        username: 'unverified_user',
        email: 'unverified@test.com',
        passwordHash: hash,
        firstName: 'Unverified',
        lastName: 'User',
        userType: UserType.CITIZEN,
        isActive: false,
        emailNotificationsEnabled: false,
      });
      const savedUser = await userRepo.save(newUser);

      // Create verification code
      const expirationDate = new Date(Date.now() + 30 * 60 * 1000);
      const codeConfirmation = codeConfirmationRepo.create({
        code: '123456',
        expirationDate,
        user: savedUser,
      });
      await codeConfirmationRepo.save(codeConfirmation);

      // Try with wrong code
      const res = await request(app).post('/api/users/validate-user').send({
        payload: { username: 'unverified_user', code: '999999' }
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Invalid verification code/i);
    });

    it('=> 400 when verification code has expired', async () => {
      // Create a new user with expired verification code
      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const codeConfirmationRepo = AppDataSource.getRepository(await import('@daos/CodeConfirmationDAO').then(m => m.CodeConfirmationDAO));

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('testpass', salt);
      const newUser = userRepo.create({
        username: 'expired_code_user',
        email: 'expired@test.com',
        passwordHash: hash,
        firstName: 'Expired',
        lastName: 'User',
        userType: UserType.CITIZEN,
        isActive: false,
        emailNotificationsEnabled: false,
      });
      const savedUser = await userRepo.save(newUser);

      // Create expired verification code (expired 1 hour ago)
      const expirationDate = new Date(Date.now() - 60 * 60 * 1000);
      const codeConfirmation = codeConfirmationRepo.create({
        code: '123456',
        expirationDate,
        user: savedUser,
      });
      await codeConfirmationRepo.save(codeConfirmation);

      const res = await request(app).post('/api/users/validate-user').send({
        payload: { username: 'expired_code_user', code: '123456' }
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/expired/i);
    });

    it('=> 204 when verification is successful', async () => {
      // Create a new user with valid verification code
      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);
      const codeConfirmationRepo = AppDataSource.getRepository(await import('@daos/CodeConfirmationDAO').then(m => m.CodeConfirmationDAO));

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('testpass', salt);
      const newUser = userRepo.create({
        username: 'valid_code_user',
        email: 'valid@test.com',
        passwordHash: hash,
        firstName: 'Valid',
        lastName: 'User',
        userType: UserType.CITIZEN,
        isActive: false,
        emailNotificationsEnabled: false,
      });
      const savedUser = await userRepo.save(newUser);

      // Create valid verification code
      const expirationDate = new Date(Date.now() + 30 * 60 * 1000);
      const codeConfirmation = codeConfirmationRepo.create({
        code: '654321',
        expirationDate,
        user: savedUser,
      });
      await codeConfirmationRepo.save(codeConfirmation);

      const res = await request(app).post('/api/users/validate-user').send({
        payload: { username: 'valid_code_user', code: '654321' }
      });
      expect(res.status).toBe(204);

      // Verify user is now active
      const updatedUser = await userRepo.findOne({ where: { username: 'valid_code_user' } });
      expect(updatedUser?.isActive).toBe(true);
    });
  });

  describe('POST /api/users/resend-user', () => {
    it('=> 400 when username is missing', async () => {
      const res = await request(app).post('/api/users/resend-user').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/username.*missing/i);
    });

    it('=> 400 when username is empty', async () => {
      const res = await request(app).post('/api/users/resend-user').send({ username: '' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/username.*missing/i);
    });

    it('=> 404 when user does not exist', async () => {
      const res = await request(app).post('/api/users/resend-user').send({
        username: 'nonexistent_user_resend'
      });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not found/i);
    });

    it('=> 400 when user is already active', async () => {
      // self_user is already active
      const res = await request(app).post('/api/users/resend-user').send({
        username: 'self_user'
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/already active/i);
    });

    it('=> 201 when resend is successful', async () => {
      // Create a new inactive user
      const { AppDataSource } = await import('@database');
      const userRepo = AppDataSource.getRepository(UserDAO);

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('testpass', salt);
      const newUser = userRepo.create({
        username: 'resend_user',
        email: 'resend@test.com',
        passwordHash: hash,
        firstName: 'Resend',
        lastName: 'User',
        userType: UserType.CITIZEN,
        isActive: false,
        emailNotificationsEnabled: false,
      });
      await userRepo.save(newUser);

      const res = await request(app).post('/api/users/resend-user').send({
        username: 'resend_user'
      });
      expect(res.status).toBe(201);

      // Verify that a new code confirmation was created
      const codeConfirmationRepo = AppDataSource.getRepository(await import('@daos/CodeConfirmationDAO').then(m => m.CodeConfirmationDAO));
      const updatedUser = await userRepo.findOne({
        where: { username: 'resend_user' },
        relations: ['codeConfirmation']
      });
      expect(updatedUser?.codeConfirmation).toBeDefined();
      expect(updatedUser?.codeConfirmation?.code).toBeDefined();
    });
  });

});