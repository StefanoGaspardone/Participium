import * as f from '@test/e2e/lifecycle';
import { app } from '@app';
import request from 'supertest';
import { AppDataSource } from '@database';
import { CompanyDAO } from '@daos/CompanyDAO';
import { CategoryDAO } from '@daos/CategoryDAO';

const ADMIN_PASSWORD = 'admin'; //NOSONAR
const USER_PASSWORD = 'user'; //NOSONAR
const PRO_PASSWORD = 'password'; //NOSONAR

describe('Companies E2E Tests', () => {
  let adminToken: string;
  let citizenToken: string;
  let proToken: string;

  beforeAll(async () => {
    await f.default.beforeAll();

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'admin', password: ADMIN_PASSWORD });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.token;

    // Login as citizen for unauthorized tests
    const citizenLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'user', password: USER_PASSWORD });
    expect(citizenLogin.status).toBe(200);
    citizenToken = citizenLogin.body.token;

    // Login as PRO (pre-populated in test data)
    const proLogin = await request(app)
      .post('/api/users/login')
      .send({ username: 'pro', password: PRO_PASSWORD });
    expect(proLogin.status).toBe(200);
    proToken = proLogin.body.token;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  describe('POST /api/companies - Create External Company', () => {
    it('should create a company with valid name and categories (admin)', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const categories = await categoryRepo.find({ take: 2 });
      expect(categories.length).toBeGreaterThanOrEqual(1);

      const payload = {
        name: 'Test Company E2E',
        categories: categories.map(cat => ({ id: cat.id, name: cat.name }))
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Test Company E2E');
      expect(res.body).toHaveProperty('categories');
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBe(categories.length);
    });

    it('should create a company with single category', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });
      expect(category).toBeDefined();

      const payload = {
        name: 'Single Category Company',
        categories: [{ id: category!.id, name: category!.name }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Single Category Company');
      expect(res.body.categories.length).toBe(1);
    });

    it('should return 400 when name is missing', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });

      const payload = {
        categories: [{ id: category!.id, name: category!.name }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(String(res.body.message).toLowerCase()).toMatch(/name.*must be specified/);
    });

    it('should return 400 when categories are missing', async () => {
      const payload = {
        name: 'No Categories Company'
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(String(res.body.message).toLowerCase()).toMatch(/categories.*must be specified/);
    });

    it('should return 400 when category does not exist', async () => {
      const payload = {
        name: 'Invalid Category Company',
        categories: [{ id: 999999, name: 'Non-existent Category' }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(String(res.body.message).toLowerCase()).toMatch(/category.*not present/);
    });

    it('should return 409 when company name already exists', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });

      const payload = {
        name: 'Duplicate Company Name',
        categories: [{ id: category!.id, name: category!.name }]
      };

      // Create first company
      const firstRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(firstRes.status).toBe(201);

      // Try to create duplicate
      const duplicateRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body).toHaveProperty('message');
      expect(String(duplicateRes.body.message).toLowerCase()).toMatch(/already exists/);
    });

    it('should return 403 when non-admin user tries to create company', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });

      const payload = {
        name: 'Unauthorized Company',
        categories: [{ id: category!.id, name: category!.name }]
      };

      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(payload);

      expect(res.status).toBe(403);
    });

    it('should return 401 when no token is provided', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });

      const payload = {
        name: 'No Auth Company',
        categories: [{ id: category!.id, name: category!.name }]
      };

      const res = await request(app)
        .post('/api/companies')
        .send(payload);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/companies - Fetch External Companies', () => {
    beforeAll(async () => {
      // Ensure we have at least one company
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });

      const payload = {
        name: `Fetch Test Company ${Date.now()}`,
        categories: [{ id: category!.id, name: category!.name }]
      };

      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
    });

    it('should return list of companies for admin', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('companies');
      expect(Array.isArray(res.body.companies)).toBe(true);
      expect(res.body.companies.length).toBeGreaterThan(0);
      
      // Check structure of returned companies
      const company = res.body.companies[0];
      expect(company).toHaveProperty('id');
      expect(company).toHaveProperty('name');
      expect(company).toHaveProperty('categories');
      expect(Array.isArray(company.categories)).toBe(true);
    });

    it('should return list of companies for PRO', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('companies');
      expect(Array.isArray(res.body.companies)).toBe(true);
    });

    it('should return 403 when citizen tries to fetch companies', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .get('/api/companies');

      expect(res.status).toBe(401);
    });

    it('should return companies with their categories populated', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.companies.length).toBeGreaterThan(0);

      const companyWithCategories = res.body.companies.find((c: any) => c.categories && c.categories.length > 0);
      expect(companyWithCategories).toBeDefined();
      expect(companyWithCategories.categories[0]).toHaveProperty('id');
      expect(companyWithCategories.categories[0]).toHaveProperty('name');
    });
  });

  describe('Company Database Features', () => {
    it('should persist company with multiple categories', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const companyRepo = AppDataSource.getRepository(CompanyDAO);
      
      const categories = await categoryRepo.find({ take: 3 });
      expect(categories.length).toBeGreaterThanOrEqual(2);

      const payload = {
        name: `Multi Category Company ${Date.now()}`,
        categories: categories.map(cat => ({ id: cat.id, name: cat.name }))
      };

      const createRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(createRes.status).toBe(201);
      const companyId = createRes.body.id;

      // Verify in database
      const savedCompany = await companyRepo.findOne({
        where: { id: companyId },
        relations: ['categories']
      });

      expect(savedCompany).toBeDefined();
      expect(savedCompany!.name).toBe(payload.name);
      expect(savedCompany!.categories.length).toBe(categories.length);
      
      // Verify category IDs match
      const savedCategoryIds = savedCompany!.categories.map(c => c.id).sort((a, b) => (a - b));
      const expectedCategoryIds = categories.map(c => c.id).sort((a, b) => (a - b));
      expect(savedCategoryIds).toEqual(expectedCategoryIds);
    });

    it('should maintain company-category relationship integrity', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      
      const category = await categoryRepo.findOne({ where: {} });
      
      const payload = {
        name: `Integrity Test Company ${Date.now()}`,
        categories: [{ id: category!.id, name: category!.name }]
      };

      const createRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      const companyId = createRes.body.id;

      // Fetch the company through the API
      const fetchRes = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      const company = fetchRes.body.companies.find((c: any) => c.id === companyId);
      expect(company).toBeDefined();
      expect(company.categories).toBeDefined();
      expect(company.categories.length).toBe(1);
      expect(company.categories[0].id).toBe(category!.id);
    });

    it('should create company and verify it appears in companies list', async () => {
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const category = await categoryRepo.findOne({ where: {} });

      const uniqueName = `List Test Company ${Date.now()}`;
      const payload = {
        name: uniqueName,
        categories: [{ id: category!.id, name: category!.name }]
      };

      // Create company
      const createRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(createRes.status).toBe(201);

      // Fetch all companies
      const listRes = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      
      // Verify the new company is in the list
      const foundCompany = listRes.body.companies.find((c: any) => c.name === uniqueName);
      expect(foundCompany).toBeDefined();
      expect(foundCompany.id).toBe(createRes.body.id);
    });
  });
});
