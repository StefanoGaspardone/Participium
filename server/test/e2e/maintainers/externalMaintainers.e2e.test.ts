import * as f from '@test/e2e/lifecycle';
import { app } from '@app';
import request from 'supertest';
import { AppDataSource } from '@database';
import { CompanyDAO } from '@daos/CompanyDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import * as bcrypt from 'bcryptjs';

describe('External Maintainers E2E Tests', () => {
  let adminToken: string;
  let citizenToken: string;
  let companyId: number;
  let categoryId: number;

  beforeAll(async () => {
    await f.default.beforeAll();

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'admin', password: 'admin' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.token;

    // Login as citizen
    const citizenLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'user', password: 'user' });
    expect(citizenLogin.status).toBe(200);
    citizenToken = citizenLogin.body.token;

    // Use the pre-populated test company
    const companyRepo = AppDataSource.getRepository(CompanyDAO);
    const testCompany = await companyRepo.findOne({ 
      where: { name: 'Test External Company' },
      relations: ['categories']
    });
    
    if (testCompany) {
      companyId = testCompany.id;
      categoryId = testCompany.categories[0]?.id;
    } else {
      // Fallback: create a company if not found
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });
      categoryId = category!.id;

      const companyPayload = {
        name: `External Maintainer Test Company ${Date.now()}`,
        categories: [{ id: category!.id, name: category!.name }]
      };

      const companyRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(companyPayload);

      expect(companyRes.status).toBe(201);
      companyId = companyRes.body.id;
    }
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  // Note: Basic creation and validation tests are in users.e2e.test.ts
  // These tests focus on additional edge cases and database verification
  describe('POST /api/users/employees - Create External Maintainer', () => {
    it('should verify external maintainer is persisted with company relationship in database', async () => {
      const payload = {
        email: `ext_maintainer_${Date.now()}@test.it`,
        password: 'MaintainerPass123!',
        firstName: 'External',
        lastName: 'Maintainer',
        username: `ext_maint_${Date.now()}`,
        userType: 'EXTERNAL_MAINTAINER',
        companyId: companyId
      };

      const res = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);

      // Verify the user was created with correct type and company in database
      const userRepo = AppDataSource.getRepository(UserDAO);
      const createdUser = await userRepo.findOne({
        where: { username: payload.username },
        relations: ['company', 'company.categories']
      });

      expect(createdUser).toBeDefined();
      expect(createdUser!.userType).toBe(UserType.EXTERNAL_MAINTAINER);
      expect(createdUser!.company).toBeDefined();
      expect(createdUser!.company!.id).toBe(companyId);
      expect(createdUser!.company!.categories).toBeDefined();
      expect(createdUser!.company!.categories.length).toBeGreaterThan(0);
    });

    it('should return 400 when companyId does not exist', async () => {
      const payload = {
        email: `ext_maintainer_invalid_${Date.now()}@test.it`,
        password: 'MaintainerPass123!',
        firstName: 'External',
        lastName: 'InvalidCompany',
        username: `ext_maint_invalid_${Date.now()}`,
        userType: 'EXTERNAL_MAINTAINER',
        companyId: 999999
      };

      const res = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(String(res.body.message).toLowerCase()).toMatch(/company.*not found/);
    });

    it('should create multiple external maintainers for same company', async () => {
      const maintainer1 = {
        email: `ext_maintainer_1_${Date.now()}@test.it`,
        password: 'MaintainerPass123!',
        firstName: 'Maintainer',
        lastName: 'One',
        username: `ext_maint_1_${Date.now()}`,
        userType: 'EXTERNAL_MAINTAINER',
        companyId: companyId
      };

      const maintainer2 = {
        email: `ext_maintainer_2_${Date.now()}@test.it`,
        password: 'MaintainerPass123!',
        firstName: 'Maintainer',
        lastName: 'Two',
        username: `ext_maint_2_${Date.now()}`,
        userType: 'EXTERNAL_MAINTAINER',
        companyId: companyId
      };

      const res1 = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maintainer1);

      const res2 = await request(app)
        .post('/api/users/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maintainer2);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      // Verify both have the same company
      const userRepo = AppDataSource.getRepository(UserDAO);
      const user1 = await userRepo.findOne({
        where: { username: maintainer1.username },
        relations: ['company']
      });
      const user2 = await userRepo.findOne({
        where: { username: maintainer2.username },
        relations: ['company']
      });

      expect(user1!.company!.id).toBe(companyId);
      expect(user2!.company!.id).toBe(companyId);
    });
  });

  describe('GET /api/users/maintainers - Fetch Maintainers by Category', () => {
    let maintainerId: number;

    beforeAll(async () => {
      // Create an external maintainer for testing
      const userRepo = AppDataSource.getRepository(UserDAO);
      const companyRepo = AppDataSource.getRepository(CompanyDAO);

      const company = await companyRepo.findOne({
        where: { id: companyId },
        relations: ['categories']
      });

      const hashedPassword = await bcrypt.hash('maintainerpass', 10);
      const maintainer = await userRepo.save({
        username: `category_maintainer_${Date.now()}`,
        firstName: 'Category',
        lastName: 'Maintainer',
        userType: UserType.EXTERNAL_MAINTAINER,
        email: `category_maint_${Date.now()}@test.it`,
        passwordHash: hashedPassword,
        isActive: true,
        company: company!
      });

      maintainerId = maintainer.id;
    });

    it('should return maintainers for valid category', async () => {
      const res = await request(app)
        .get(`/api/users/maintainers?categoryId=${categoryId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      // Should include our created maintainer
      const foundMaintainer = res.body.find((m: any) => m.id === maintainerId);
      expect(foundMaintainer).toBeDefined();
      expect(foundMaintainer.userType).toBe('EXTERNAL_MAINTAINER');
      expect(foundMaintainer.company).toBeDefined();
    });

    it('should return 400 when categoryId is missing', async () => {
      const res = await request(app)
        .get('/api/users/maintainers');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(String(res.body.message).toLowerCase()).toMatch(/categoryid.*required/);
    });

    it('should return 400 when categoryId is not a valid number', async () => {
      const res = await request(app)
        .get('/api/users/maintainers?categoryId=invalid');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(String(res.body.message).toLowerCase()).toMatch(/id must be a valid number/);
    });

    it('should return 404 when category does not exist', async () => {
      const res = await request(app)
        .get('/api/users/maintainers?categoryId=999999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(String(res.body.message).toLowerCase()).toMatch(/category.*not found/);
    });

    it('should return empty array when no maintainers exist for category', async () => {
      // Create a category with no associated company
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const categories = await categoryRepo.find();
      
      // Find a category that has no companies
      const companyRepo = AppDataSource.getRepository(CompanyDAO);
      const companies = await companyRepo.find({ relations: ['categories'] });
      
      const usedCategoryIds = new Set(
        companies.flatMap(c => c.categories.map(cat => cat.id))
      );
      
      const unusedCategory = categories.find(cat => !usedCategoryIds.has(cat.id));
      
      if (unusedCategory) {
        const res = await request(app)
          .get(`/api/users/maintainers?categoryId=${unusedCategory.id}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
      }
    });

    it('should return only EXTERNAL_MAINTAINER type users', async () => {
      const res = await request(app)
        .get(`/api/users/maintainers?categoryId=${categoryId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // All returned users should be EXTERNAL_MAINTAINER type
      res.body.forEach((user: any) => {
        expect(user.userType).toBe('EXTERNAL_MAINTAINER');
      });
    });

    it('should include company information in maintainer response', async () => {
      const res = await request(app)
        .get(`/api/users/maintainers?categoryId=${categoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);

      const maintainer = res.body[0];
      expect(maintainer).toHaveProperty('company');
      expect(maintainer.company).toHaveProperty('id');
      expect(maintainer.company).toHaveProperty('name');
    });
  });
});
