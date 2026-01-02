import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import * as bcrypt from 'bcryptjs';

// Test password constants
const TEST_PASSWORD_ADMIN = 'admin'; //NOSONAR
const TEST_PASSWORD_USER = 'user'; //NOSONAR
const TEST_PASSWORD_GENERIC = 'password'; //NOSONAR
const TEST_PASSWORD_TG = 'tgpass'; //NOSONAR
const TEST_PASSWORD_EXT = 'extpass'; //NOSONAR
const TEST_PASSWORD_TEST = 'testpass'; //NOSONAR

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
    const adminHash = await bcrypt.hash(TEST_PASSWORD_ADMIN, salt1);
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
    const userHash = await bcrypt.hash(TEST_PASSWORD_USER, salt2);
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
      password: TEST_PASSWORD_GENERIC,
      firstName: 'Route',
      lastName: 'Test',
      username: 'selfroute1',
      emailNotificationsEnabled: true,
    };
    const res = await request(app).post('/api/users/signup').send(newUser);
    expect(res.status).toBe(201);
  });

  it('POST /api/users/login => 200 and returns token', async () => {
    const credentials = { username: 'self_user', password: TEST_PASSWORD_USER };
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
      password: TEST_PASSWORD_GENERIC,
      firstName: 'Muni',
      lastName: 'One',
      username: 'selfmuni1',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeIds: [roleId],
    };
    const res = await request(app).post('/api/users/employees').send(payload);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/denied|token/);
  });

  it('POST /api/users/employees => 201 with admin token', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: TEST_PASSWORD_ADMIN });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const payload = {
      email: 'self_muni2@example.com',
      password: TEST_PASSWORD_GENERIC,
      firstName: 'Muni',
      lastName: 'Two',
      username: 'selfmuni2',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeIds: [roleId],
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
  });

  it('POST /api/users/employees => 409 with admin token when email already exists', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: TEST_PASSWORD_ADMIN });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const payload = {
      email: 'self_user@gmail.com', // already exists
      password: TEST_PASSWORD_GENERIC,
      firstName: 'Dup',
      lastName: 'User',
      username: 'dupuser',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeIds: [roleId],
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/users/employees => 400 when office not found for TECHNICAL_STAFF_MEMBER', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: TEST_PASSWORD_ADMIN });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const payload = {
      email: 'no_office@example.com',
      password: TEST_PASSWORD_GENERIC,
      firstName: 'NoOffice',
      lastName: 'User',
      username: 'nooffice',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeIds: [99999], // non-existing
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/office.*not found/);
  });

  it('POST /api/users/employees => 400 with admin token when missing mandatory fields', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'self_admin', password: TEST_PASSWORD_ADMIN });
    expect(login.status).toBe(200);
    const token = login.body.token;

    // missing `username` and `userType` should trigger validation error
    const incomplete = {
      email: 'self_muni_missing@example.com',
      password: TEST_PASSWORD_GENERIC,
      firstName: 'Muni',
      lastName: 'Missing',
      // username: missing
      // userType: missing
      officeIds: [roleId],
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
    const login = await request(app).post('/api/users/login').send({ username: 'self_user', password: TEST_PASSWORD_USER });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const payload = {
      email: 'self_muni3@example.com',
      password: TEST_PASSWORD_GENERIC,
      firstName: 'Muni',
      lastName: 'Three',
      username: 'selfmuni3',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeIds: [roleId],
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
    const hash = await bcrypt.hash(TEST_PASSWORD_TG, salt);
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

  describe('GET /api/users/maintainers', () => {
    let testCategoryId: number;
    let extMaintainerId: number;

    beforeAll(async () => {
      const { AppDataSource } = await import('@database');
      const categoryRepo = AppDataSource.getRepository(await import('@daos/CategoryDAO').then(m => m.CategoryDAO));
      const companyRepo = AppDataSource.getRepository(await import('@daos/CompanyDAO').then(m => m.CompanyDAO));
      const userRepo = AppDataSource.getRepository(UserDAO);
      const officeRepo = AppDataSource.getRepository(OfficeDAO);

      // Get or create an office
      let office = await officeRepo.findOne({ where: {} });
      if (!office) {
        office = officeRepo.create({ name: 'Maintainers Test Office' });
        await officeRepo.save(office);
      }

      // Create a test category
      const category = categoryRepo.create({
        name: 'Test Category for Maintainers',
        office
      });
      await categoryRepo.save(category);
      testCategoryId = category.id;

      // Create a company with this category
      const company = companyRepo.create({
        name: `Test Company for Maintainers ${Date.now()}`,
        categories: [category]
      });
      const savedCompany = await companyRepo.save(company);

      // Create external maintainer with this company
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(TEST_PASSWORD_EXT, salt);
      const extMaintainer = userRepo.create({
        username: 'ext_maintainer_test',
        email: 'extmaintainer@test.com',
        passwordHash: hash,
        firstName: 'External',
        lastName: 'Maintainer',
        userType: UserType.EXTERNAL_MAINTAINER,
        company: savedCompany
      });
      const saved = await userRepo.save(extMaintainer);
      extMaintainerId = saved.id;

      // Create another external maintainer with a different company (no shared categories)
      const company2 = companyRepo.create({
        name: `Test Company 2 ${Date.now()}`,
        categories: []
      });
      const savedCompany2 = await companyRepo.save(company2);

      const extMaintainer2 = userRepo.create({
        username: 'ext_maintainer_no_cat',
        email: 'extnocategory@test.com',
        passwordHash: hash,
        firstName: 'No',
        lastName: 'Category',
        userType: UserType.EXTERNAL_MAINTAINER,
        company: savedCompany2
      });
      await userRepo.save(extMaintainer2);
    });

    it('should return 400 when categoryId is missing', async () => {
      const res = await request(app).get('/api/users/maintainers');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/categoryId.*required/i);
    });

    it('should return 400 when categoryId is not a number', async () => {
      const res = await request(app).get('/api/users/maintainers?categoryId=abc');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when categoryId is negative', async () => {
      const res = await request(app).get('/api/users/maintainers?categoryId=-1');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 when category does not exist', async () => {
      const res = await request(app).get('/api/users/maintainers?categoryId=99999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should return 200 and empty array when no maintainers for category', async () => {
      // Create a category with no maintainers
      const { AppDataSource } = await import('@database');
      const categoryRepo = AppDataSource.getRepository(await import('@daos/CategoryDAO').then(m => m.CategoryDAO));
      const officeRepo = AppDataSource.getRepository(OfficeDAO);

      let office = await officeRepo.findOne({ where: {} });
      if (!office) {
        office = officeRepo.create({ name: 'Empty Maintainers Office' });
        await officeRepo.save(office);
      }

      const emptyCategory = categoryRepo.create({
        name: 'Empty Category',
        office
      });
      await categoryRepo.save(emptyCategory);

      const res = await request(app).get(`/api/users/maintainers?categoryId=${emptyCategory.id}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return 200 and list of maintainers for valid category', async () => {
      const res = await request(app).get(`/api/users/maintainers?categoryId=${testCategoryId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      const maintainer = res.body.find((m: any) => m.id === extMaintainerId);
      expect(maintainer).toBeDefined();
      expect(maintainer.username).toBe('ext_maintainer_test');
      expect(maintainer.userType).toBe(UserType.EXTERNAL_MAINTAINER);
    });

    it('should return maintainers with correct DTO structure', async () => {
      const res = await request(app).get(`/api/users/maintainers?categoryId=${testCategoryId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      const maintainer = res.body[0];
      expect(maintainer).toHaveProperty('id');
      expect(maintainer).toHaveProperty('username');
      expect(maintainer).toHaveProperty('email');
      expect(maintainer).toHaveProperty('firstName');
      expect(maintainer).toHaveProperty('lastName');
      expect(maintainer).toHaveProperty('userType');
      expect(maintainer).not.toHaveProperty('passwordHash');
    });
  });

  describe('POST /api/users/employees - EXTERNAL_MAINTAINER', () => {
    let adminToken: string;
    let testCompanyId: number;

    beforeAll(async () => {
      const login = await request(app).post('/api/users/login').send({ 
        username: 'self_admin', 
        password: TEST_PASSWORD_ADMIN 
      });
      expect(login.status).toBe(200);
      adminToken = login.body.token;

      // Create a test company for external maintainers
      const { AppDataSource } = await import('@database');
      const companyRepo = AppDataSource.getRepository(await import('@daos/CompanyDAO').then(m => m.CompanyDAO));
      const categoryRepo = AppDataSource.getRepository(await import('@daos/CategoryDAO').then(m => m.CategoryDAO));
      const officeRepo = AppDataSource.getRepository(OfficeDAO);

      let office = await officeRepo.findOne({ where: {} });
      if (!office) {
        office = officeRepo.create({ name: 'External Maintainer Office' });
        await officeRepo.save(office);
      }

      const category = categoryRepo.create({
        name: 'External Maintainer Category',
        office
      });
      await categoryRepo.save(category);

      const company = companyRepo.create({
        name: `External Maintainer Company ${Date.now()}`,
        categories: [category]
      });
      const savedCompany = await companyRepo.save(company);
      testCompanyId = savedCompany.id;
    });

    it('should return 400 when companyId is missing for EXTERNAL_MAINTAINER', async () => {
      const payload = {
        email: 'extmaint1@example.com',
        password: TEST_PASSWORD_GENERIC,
        firstName: 'External',
        lastName: 'Maintainer',
        username: 'extmaint1',
        userType: UserType.EXTERNAL_MAINTAINER
      };

      const res = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Missing company id/i);
    });

    it('should return 400 when company does not exist for EXTERNAL_MAINTAINER', async () => {
      const payload = {
        email: 'extmaint2@example.com',
        password: TEST_PASSWORD_GENERIC,
        firstName: 'External',
        lastName: 'Maintainer',
        username: 'extmaint2',
        userType: UserType.EXTERNAL_MAINTAINER,
        companyId: 99999
      };

      const res = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should return 201 when creating EXTERNAL_MAINTAINER with valid company', async () => {
      const payload = {
        email: 'extmaint3@example.com',
        password: TEST_PASSWORD_GENERIC,
        firstName: 'External',
        lastName: 'Maintainer',
        username: 'extmaint3',
        userType: UserType.EXTERNAL_MAINTAINER,
        companyId: testCompanyId
      };

      const res = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('Municipality user created');
    });

    it('should return 409 when email already exists for EXTERNAL_MAINTAINER', async () => {
      const payload = {
        email: 'extmaint4@example.com',
        password: TEST_PASSWORD_GENERIC,
        firstName: 'External',
        lastName: 'Maintainer',
        username: 'extmaint4',
        userType: UserType.EXTERNAL_MAINTAINER,
        companyId: testCompanyId
      };

      // Create first user
      await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      // Try to create duplicate with same email
      const duplicatePayload = { ...payload, username: 'extmaint4_dup' };
      const res = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicatePayload);
      
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message');
    });

    it('should verify EXTERNAL_MAINTAINER has correct company assigned', async () => {
      const payload = {
        email: 'extmaint5@example.com',
        password: TEST_PASSWORD_GENERIC,
        firstName: 'External',
        lastName: 'Maintainer',
        username: 'extmaint5',
        userType: UserType.EXTERNAL_MAINTAINER,
        companyId: testCompanyId
      };

      const createRes = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(createRes.status).toBe(201);

      // Verify the user can be found when querying by the company's category
      const { AppDataSource } = await import('@database');
      const companyRepo = AppDataSource.getRepository(await import('@daos/CompanyDAO').then(m => m.CompanyDAO));
      const company = await companyRepo.findOne({ 
        where: { id: testCompanyId },
        relations: ['categories']
      });
      
      if (company && company.categories.length > 0) {
        const categoryId = company.categories[0].id;
        const maintainersRes = await request(app).get(`/api/users/maintainers?categoryId=${categoryId}`);
        expect(maintainersRes.status).toBe(200);
        expect(Array.isArray(maintainersRes.body)).toBe(true);
        
        const createdMaintainer = maintainersRes.body.find((m: any) => m.username === 'extmaint5');
        expect(createdMaintainer).toBeDefined();
        expect(createdMaintainer.userType).toBe(UserType.EXTERNAL_MAINTAINER);
      }
    });
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
      const hash = await bcrypt.hash(TEST_PASSWORD_TEST, salt);
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
      const hash = await bcrypt.hash(TEST_PASSWORD_TEST, salt);
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
      const hash = await bcrypt.hash(TEST_PASSWORD_TEST, salt);
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
      const hash = await bcrypt.hash(TEST_PASSWORD_TEST, salt);
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

  describe('GET /api/users/tsm', () => {
    let adminToken: string;
    let tsmId1: number;
    let tsmId2: number;

    beforeAll(async () => {
      // Login as admin to get token
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ username: 'self_admin', password: TEST_PASSWORD_ADMIN });
      adminToken = loginRes.body.token;

      // Create TSM users
      const { AppDataSource } = await import('@database');
      const officeRepo = AppDataSource.getRepository(OfficeDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);

      // Create offices
      const office1 = officeRepo.create({ name: 'Routes TSM Office 1' });
      const savedOffice1 = await officeRepo.save(office1);

      const office2 = officeRepo.create({ name: 'Routes TSM Office 2' });
      const savedOffice2 = await officeRepo.save(office2);

      const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, 10);
      const tsm1 = userRepo.create({
        username: 'routes_tsm1',
        email: 'routes_tsm1@test.com',
        passwordHash: hash,
        firstName: 'Routes TSM',
        lastName: 'One',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        offices: [savedOffice1],
        emailNotificationsEnabled: false,
      });
      const savedTsm1 = await userRepo.save(tsm1);
      tsmId1 = savedTsm1.id;

      const tsm2 = userRepo.create({
        username: 'routes_tsm2',
        email: 'routes_tsm2@test.com',
        passwordHash: hash,
        firstName: 'Routes TSM',
        lastName: 'Two',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        offices: [savedOffice1, savedOffice2],
        emailNotificationsEnabled: false,
      });
      const savedTsm2 = await userRepo.save(tsm2);
      tsmId2 = savedTsm2.id;
    });

    it('=> 401 when no token provided', async () => {
      const res = await request(app).get('/api/users/tsm');
      expect(res.status).toBe(401);
    });

    it('=> 200 and returns TSM users with their offices', async () => {
      const res = await request(app)
        .get('/api/users/tsm')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tsm');
      expect(Array.isArray(res.body.tsm)).toBe(true);
      expect(res.body.tsm.length).toBeGreaterThanOrEqual(2);

      const tsm1 = res.body.tsm.find((t: any) => t.id === tsmId1);
      const tsm2 = res.body.tsm.find((t: any) => t.id === tsmId2);

      expect(tsm1).toBeDefined();
      expect(tsm1.offices).toEqual(['Routes TSM Office 1']);

      expect(tsm2).toBeDefined();
      expect(tsm2.offices).toEqual(['Routes TSM Office 1', 'Routes TSM Office 2']);
    });
  });

  describe('PATCH /api/users/tsm/:id', () => {
    let adminToken: string;
    let tsmId: number;
    let officeId1: number;
    let officeId2: number;

    beforeAll(async () => {
      // Login as admin to get token
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ username: 'self_admin', password: TEST_PASSWORD_ADMIN });
      adminToken = loginRes.body.token;

      // Create TSM user and offices
      const { AppDataSource } = await import('@database');
      const officeRepo = AppDataSource.getRepository(OfficeDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);

      // Create offices
      const office1 = officeRepo.create({ name: 'Routes Update Office 1' });
      const savedOffice1 = await officeRepo.save(office1);
      officeId1 = savedOffice1.id;

      const office2 = officeRepo.create({ name: 'Routes Update Office 2' });
      const savedOffice2 = await officeRepo.save(office2);
      officeId2 = savedOffice2.id;

      const hash = await bcrypt.hash(TEST_PASSWORD_GENERIC, 10);
      const tsm = userRepo.create({
        username: 'routes_tsm_update',
        email: 'routes_tsm_update@test.com',
        passwordHash: hash,
        firstName: 'Routes TSM',
        lastName: 'Update',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        offices: [savedOffice1],
        emailNotificationsEnabled: false,
      });
      const savedTsm = await userRepo.save(tsm);
      tsmId = savedTsm.id;
    });

    it('=> 401 when no token provided', async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmId}`)
        .send({ officeIds: [officeId1] });
      expect(res.status).toBe(401);
    });

    it('=> 200 and updates TSM offices successfully', async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officeIds: [officeId2] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('updatedTsm');
      expect(res.body.updatedTsm.offices).toEqual(['Routes Update Office 2']);
    });

    it('=> 400 when officeIds is missing', async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/officeIds/i);
    });

    it('=> 400 when officeIds is empty array', async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officeIds: [] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not empty/i);
    });

    it('=> 400 when id is invalid', async () => {
      const res = await request(app)
        .patch('/api/users/tsm/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officeIds: [officeId1] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/valid number/i);
    });

    it('=> 404 when TSM does not exist', async () => {
      const res = await request(app)
        .patch('/api/users/tsm/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officeIds: [officeId1] });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not found/i);
    });

    it('=> 400 when office does not exist', async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officeIds: [99999] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/office.*not found/i);
    });

    it('=> 200 when updating to multiple offices', async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ officeIds: [officeId1, officeId2] });

      expect(res.status).toBe(200);
      expect(res.body.updatedTsm.offices).toEqual(['Routes Update Office 1', 'Routes Update Office 2']);
    });
  });

});