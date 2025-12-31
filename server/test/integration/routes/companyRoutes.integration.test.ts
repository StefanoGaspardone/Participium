import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import * as bcrypt from 'bcryptjs';

const TEST_PASSWORD = 'testpass123'; //NOSONAR

describe('Company routes integration tests', () => {
  let AppDataSource: any;
  let adminToken: string;
  let proToken: string;
  let citizenToken: string;
  let categoryId1: number;
  let categoryId2: number;

  beforeAll(async () => {
    AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const officeRepo = AppDataSource.getRepository(OfficeDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);

    // Create office
    const office = officeRepo.create({ name: 'Company Test Office' });
    await officeRepo.save(office);

    // Create categories
    const category1 = categoryRepo.create({ name: 'Potholes', office });
    const category2 = categoryRepo.create({ name: 'Lighting', office });
    await categoryRepo.save([category1, category2]);
    categoryId1 = category1.id;
    categoryId2 = category2.id;

    const salt = await bcrypt.genSalt(10);

    // Create admin user
    const adminHash = await bcrypt.hash(TEST_PASSWORD, salt);
    const adminUser = userRepo.create({
      username: 'company_admin',
      email: 'company_admin@test.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      userType: UserType.ADMINISTRATOR,
    });
    await userRepo.save(adminUser);

    // Create PRO user
    const proHash = await bcrypt.hash(TEST_PASSWORD, salt);
    const proUser = userRepo.create({
      username: 'company_pro',
      email: 'company_pro@test.com',
      passwordHash: proHash,
      firstName: 'PRO',
      lastName: 'User',
      userType: UserType.PUBLIC_RELATIONS_OFFICER,
    });
    await userRepo.save(proUser);

    // Create citizen user
    const citizenHash = await bcrypt.hash(TEST_PASSWORD, salt);
    const citizenUser = userRepo.create({
      username: 'company_citizen',
      email: 'company_citizen@test.com',
      passwordHash: citizenHash,
      firstName: 'Citizen',
      lastName: 'User',
      userType: UserType.CITIZEN,
    });
    await userRepo.save(citizenUser);

    // Login and get tokens
    const adminLogin = await request(app).post('/api/users/login').send({ 
      username: 'company_admin', 
      password: TEST_PASSWORD 
    });
    adminToken = adminLogin.body.token;

    const proLogin = await request(app).post('/api/users/login').send({ 
      username: 'company_pro', 
      password: TEST_PASSWORD 
    });
    proToken = proLogin.body.token;

    const citizenLogin = await request(app).post('/api/users/login').send({ 
      username: 'company_citizen', 
      password: TEST_PASSWORD 
    });
    citizenToken = citizenLogin.body.token;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('GET /api/companies', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/companies');
      expect(res.status).toBe(401);
    });

    it('should return 403 with citizen token', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 and companies array with admin token', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('companies');
      expect(Array.isArray(res.body.companies)).toBe(true);
    });

    it('should return 200 and companies array with PRO token', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${proToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('companies');
      expect(Array.isArray(res.body.companies)).toBe(true);
    });
  });

  describe('POST /api/companies', () => {
    it('should return 401 without token', async () => {
      const payload = {
        name: 'New Company',
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .send(payload);
      
      expect(res.status).toBe(401);
    });

    it('should return 403 with PRO token', async () => {
      const payload = {
        name: 'New Company',
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${proToken}`)
        .send(payload);
      
      expect(res.status).toBe(403);
    });

    it('should return 403 with citizen token', async () => {
      const payload = {
        name: 'New Company',
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(payload);
      
      expect(res.status).toBe(403);
    });

    it('should return 400 when name is missing', async () => {
      const payload = {
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when categories is missing', async () => {
      const payload = {
        name: 'New Company'
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when name is empty string', async () => {
      const payload = {
        name: '',
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/name cannot be empty/i);
    });

    it('should return 400 when name is only whitespace', async () => {
      const payload = {
        name: '   ',
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/name cannot be empty/i);
    });

    it('should return 400 when categories array is empty', async () => {
      const payload = {
        name: `EmptyCategories_${Date.now()}`,
        categories: []
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least one category/i);
    });

    it('should return 400 when category does not exist', async () => {
      const payload = {
        name: `NonExistentCat_${Date.now()}`,
        categories: [{ id: 99999, name: 'NonExistent' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not present/i);
    });

    it('should return 400 when one of multiple categories does not exist', async () => {
      const payload = {
        name: `PartialInvalid_${Date.now()}`,
        categories: [
          { id: categoryId1, name: 'Potholes' },
          { id: 99999, name: 'NonExistent' }
        ]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/not present/i);
    });

    it('should return 201 when creating company with valid data', async () => {
      const companyName = `ValidCompany_${Date.now()}`;
      const payload = {
        name: companyName,
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(companyName);
      expect(res.body.categories).toHaveLength(1);
      expect(res.body.categories[0].id).toBe(categoryId1);
    });

    it('should return 201 when creating company with multiple categories', async () => {
      const companyName = `MultiCategoryCompany_${Date.now()}`;
      const payload = {
        name: companyName,
        categories: [
          { id: categoryId1, name: 'Potholes' },
          { id: categoryId2, name: 'Lighting' }
        ]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(companyName);
      expect(res.body.categories).toHaveLength(2);
    });

    it('should trim company name when creating', async () => {
      const payload = {
        name: `  TrimmedCompany_${Date.now()}  `,
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.name).toBe(payload.name.trim());
    });

    it('should return 409 when company name already exists', async () => {
      const companyName = `DuplicateCompany_${Date.now()}`;
      const payload = {
        name: companyName,
        categories: [{ id: categoryId1, name: 'Potholes' }]
      };

      // Create first company
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      // Try to create duplicate
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/already exists/i);
    });
  });
});
