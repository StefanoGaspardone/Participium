import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { CONFIG } from '@config';
import * as bcrypt from 'bcryptjs';

describe('Report routes integration tests', () => {
  let categoryId: number | undefined;
  let AppDataSource: any;
  let token: string;
  let proToken: string;
  let adminToken: string;

  beforeAll(async () => {
    AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const roleRepo = AppDataSource.getRepository(OfficeDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);

    const role = roleRepo.create({ name: 'Reports Test Role' });
    await roleRepo.save(role);

    const category = categoryRepo.create({ name: 'Potholes', office: role });
    await categoryRepo.save(category);
    categoryId = category.id;

    const salt = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash('citizen', salt);
    const citizen = userRepo.create({
      username: 'citizen_user',
      email: 'citizen_user@gmail.com',
      passwordHash: userHash,
      firstName: 'Citizen',
      lastName: 'User',
      userType: UserType.CITIZEN,
    });
    await userRepo.save(citizen);

    const proHash = await bcrypt.hash('pro', salt);
    const proUser = userRepo.create({
      username: 'pro_user',
      email: 'pro@gmail.com',
      passwordHash: proHash,
      firstName: 'Pro',
      lastName: 'User',
      userType: UserType.PUBLIC_RELATIONS_OFFICER,
    });
    await userRepo.save(proUser);

    const adminHash = await bcrypt.hash('admin', salt);
    const adminUser = userRepo.create({
      username: 'admin_user',
      email: 'admin@gmail.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      userType: UserType.MUNICIPAL_ADMINISTRATOR,
    });
    await userRepo.save(adminUser);

    // login once and cache token for tests
    const login = await request(app).post('/api/users/login').send({ username: 'citizen_user', password: 'citizen' });
    expect(login.status).toBe(200);
    token = login.body.token as string;

    const loginPro = await request(app).post('/api/users/login').send({ username: 'pro_user', password: 'pro' });
    proToken = loginPro.body.token as string;

    const loginAdmin = await request(app).post('/api/users/login').send({ username: 'admin_user', password: 'admin' });
    adminToken = loginAdmin.body.token as string;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('POST /api/reports => 401 without token', async () => {
    const payload = {};
    const res = await request(app).post('/api/reports').send(payload);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/denied|token/);
  });

  const getValidPayload = () => ({
    payload: {
      title: 'Valid title',
      description: 'Valid description',
      categoryId: categoryId,
      images: ['http://example.com/1.jpg'],
      lat: 45.07,
      long: 7.65,
      anonymous: false,
    },
  });

  const invalidCases: Array<[string, any, string]> = [
    ['title not string', { payload: { title: 123 } }, 'title'],
    ['images empty', { payload: { images: [] } }, 'images'],
    ['images > 3', { payload: { images: ['1', '2', '3', '4'] } }, 'images'],
    ['anonymous not boolean', { payload: { anonymous: 'no' } }, 'anonymous'],
    ['categoryId invalid number', { payload: { categoryId: -1 } }, 'categoryId'],
  ];

  test.each(invalidCases)('POST /api/reports => 400 when %s', async (_name, patch, expectedField) => {
    const body = { payload: { ...(getValidPayload().payload as any), ...(patch.payload || {}) } };
    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty(expectedField);
  });

  it('POST /api/reports => 201 with valid payload', async () => {
    const goodPayload = {
      payload: {
        ...getValidPayload().payload,
        title: 'Broken sidewalk',
        description: 'There is a large crack on the sidewalk near XY',
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(goodPayload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');

    // assert persistence in DB
    const repo = AppDataSource.getRepository(ReportDAO);
    const created = await repo.findOne({ where: { title: 'Broken sidewalk' }, relations: ['category', 'createdBy'] });
    expect(created).toBeDefined();
    expect(created?.category?.id).toBe(categoryId);
  });

  it('POST /api/reports => 201 with 3 images (upper images boundary)', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'citizen_user', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Many images',
        description: 'Testing three images allowed',
        categoryId: categoryId,
        images: ['http://example.com/1.jpg', 'http://example.com/2.jpg', 'http://example.com/3.jpg'],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(201);
  });

  it('POST /api/reports => 201 with lat/long at allowed boundaries', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'citizen_user', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Boundary coords',
        description: 'Using valid Turin coordinates',
        categoryId: categoryId,
        images: ['http://example.com/1.jpg'],
        lat: 45.0703,
        long: 7.6869,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(201);
  });

  it('POST /api/reports => 400 when coordinates are outside Turin', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'citizen_user', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Bad location',
        description: 'Coordinates outside Turin',
        categoryId: categoryId,
        images: ['http://example.com/1.jpg'],
        lat: 40.0,
        long: 8.0,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('location');
  });

  it('POST /api/reports => 400 when coordinates are outside Turin (south)', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'citizen_user', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Bad location south',
        description: 'Coordinates outside Turin boundaries',
        categoryId: categoryId,
        images: ['http://example.com/1.jpg'],
        lat: 44.5,
        long: 7.6869,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('location');
  });

  it('POST /api/reports => 404 when categoryId does not exist', async () => {
    const login = await request(app).post('/api/users/login').send({ username: 'citizen_user', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Unknown category',
        description: 'Category id does not exist',
        categoryId: 999999, // non existing
        images: ['http://example.com/1.jpg'],
        lat: 45.0703,
        long: 7.6869,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/not found/);
  });

  // GET /api/reports
  describe('GET /api/reports', () => {
    it('should return 400 if status query param is missing', async () => {
      const res = await request(app).get('/api/reports');
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('status');
    });

    it('should return 400 if status query param is invalid', async () => {
      const res = await request(app).get('/api/reports?status=INVALID_STATUS');
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('status');
    });

    it('should return 200 and a list of reports for valid status', async () => {
      // Create a report first
      const payload = {
        payload: {
          title: 'Open Report',
          description: 'Description',
          categoryId: categoryId,
          images: ['http://example.com/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      };
      await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);

      const res = await request(app).get(`/api/reports?status=${ReportStatus.PendingApproval}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(Array.isArray(res.body.reports)).toBe(true);
      expect(res.body.reports.length).toBeGreaterThan(0);
      expect(res.body.reports[0].status).toBe(ReportStatus.PendingApproval);
    });
  });

  // PUT /api/reports/:id/category
  describe('PUT /api/reports/:id/category', () => {
    let reportId: number;

    beforeEach(async () => {
      // Create a fresh report
      const payload = {
        payload: {
          title: 'Report for Category Update',
          description: 'Description',
          categoryId: categoryId,
          images: ['http://example.com/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      };
      const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
      // We need to fetch the report to get ID, or assume it's the last one.
      // But createReport doesn't return ID in the response body based on previous test (it returns message).
      // So we query DB.
      const repo = AppDataSource.getRepository(ReportDAO);
      const report = await repo.findOne({ where: { title: 'Report for Category Update' } });
      reportId = report.id;
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/category`).send({ categoryId });
      expect(res.status).toBe(401);
    });

    it('should return 403 if user is Citizen', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/category`).set('Authorization', `Bearer ${token}`).send({ categoryId });
      expect(res.status).toBe(403);
    });

    it('should return 400 if categoryId is invalid', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/category`).set('Authorization', `Bearer ${proToken}`).send({ categoryId: -1 });
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('categoryId');
    });

    it('should return 200 if PRO updates category', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/category`).set('Authorization', `Bearer ${proToken}`).send({ categoryId });
      expect(res.status).toBe(200);
      expect(res.body.report.category.id).toBe(categoryId);
    });

    it('should return 200 if Admin updates category', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/category`).set('Authorization', `Bearer ${adminToken}`).send({ categoryId });
      expect(res.status).toBe(200);
    });
  });

  // PUT /api/reports/:id/status/public
  describe('PUT /api/reports/:id/status/public', () => {
    let reportId: number;

    beforeEach(async () => {
      const payload = {
        payload: {
          title: 'Report for Status Update',
          description: 'Description',
          categoryId: categoryId,
          images: ['http://example.com/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      };
      await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
      const repo = AppDataSource.getRepository(ReportDAO);
      const report = await repo.findOne({ where: { title: 'Report for Status Update' } });
      reportId = report.id;
    });

    it('should return 403 if Admin tries (only PRO allowed)', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/status/public`).set('Authorization', `Bearer ${adminToken}`).send({ status: ReportStatus.Assigned });
      expect(res.status).toBe(403);
    });

    it('should return 400 if status is invalid', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/status/public`).set('Authorization', `Bearer ${proToken}`).send({ status: 'INVALID' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('status');
    });

    it('should return 400 if status is Rejected but no description', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/status/public`).set('Authorization', `Bearer ${proToken}`).send({ status: ReportStatus.Rejected });
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('rejectedDescription');
    });

    it('should return 400 if PRO assigns report but no technical staff exists for the office', async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ status: ReportStatus.Assigned });

      expect(res.status).toBe(400);
    });

    it('should return 200 if PRO assigns report and technical staff exists', async () => {
      const userRepo = AppDataSource.getRepository(UserDAO);
      const roleRepo = AppDataSource.getRepository(OfficeDAO);

      const role = await roleRepo.findOne({ where: { name: 'Reports Test Role' } });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('tech', salt);
      const techUser = userRepo.create({
        username: 'tech_user',
        email: 'tech@gmail.com',
        passwordHash: hash,
        firstName: 'Tech',
        lastName: 'Staff',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: role,
      });
      await userRepo.save(techUser);

      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set('Authorization', `Bearer ${proToken}`)
        .send({ status: ReportStatus.Assigned });
      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe(ReportStatus.Assigned);
    });

    it('should return 200 if PRO rejects report with description', async () => {
      const res = await request(app).put(`/api/reports/${reportId}/status/public`).set('Authorization', `Bearer ${proToken}`).send({ status: ReportStatus.Rejected, rejectedDescription: 'Not a valid report' });
      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe(ReportStatus.Rejected);
    });
  });

  // GET /api/reports/assigned
  describe('GET /api/reports/assigned', () => {
    let techToken: string;
    let techUserId: number;

    beforeAll(async () => {
      // Create a technical staff member
      const userRepo = AppDataSource.getRepository(UserDAO);
      const roleRepo = AppDataSource.getRepository(OfficeDAO);
      const role = await roleRepo.findOne({ where: { name: 'Reports Test Role' } });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('tech', salt);
      const techUser = userRepo.create({
        username: 'tech_assigned_test',
        email: 'tech_assigned@gmail.com',
        passwordHash: hash,
        firstName: 'Tech',
        lastName: 'Assigned',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: role,
      });
      const savedTech = await userRepo.save(techUser);
      techUserId = savedTech.id;

      const loginTech = await request(app).post('/api/users/login').send({ username: 'tech_assigned_test', password: 'tech' });
      techToken = loginTech.body.token as string;
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/reports/assigned');
      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not a technical staff member', async () => {
      const res = await request(app).get('/api/reports/assigned').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return empty array when no reports assigned', async () => {
      const res = await request(app).get('/api/reports/assigned').set('Authorization', `Bearer ${techToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(Array.isArray(res.body.reports)).toBe(true);
      expect(res.body.reports.length).toBe(0);
    });

    it('should return assigned reports for technical staff member', async () => {
      // Create and assign a report to the tech user
      const payload = {
        payload: {
          title: 'Assigned Report Test',
          description: 'Description',
          categoryId: categoryId,
          images: ['http://example.com/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      };
      await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);

      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const report = await reportRepo.findOne({ where: { title: 'Assigned Report Test' } });
      const userRepo = AppDataSource.getRepository(UserDAO);
      const techUser = await userRepo.findOne({ where: { id: techUserId } });

      report.status = ReportStatus.Assigned;
      report.assignedTo = techUser;
      await reportRepo.save(report);

      const res = await request(app).get('/api/reports/assigned').set('Authorization', `Bearer ${techToken}`);
      expect(res.status).toBe(200);
      expect(res.body.reports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Assigned Report Test',
            status: ReportStatus.Assigned
          })
        ])
      );
    });

    it('should only return reports assigned to the authenticated user', async () => {
      const userRepo = AppDataSource.getRepository(UserDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const roleRepo = AppDataSource.getRepository(OfficeDAO);
      const role = await roleRepo.findOne({ where: { name: 'Reports Test Role' } });
      const techUser = await userRepo.findOne({ where: { id: techUserId } });

      // Create another tech user
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('tech2', salt);
      const techUser2 = userRepo.create({
        username: 'tech_other',
        email: 'tech_other@gmail.com',
        passwordHash: hash,
        firstName: 'Tech',
        lastName: 'Other',
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: role,
      });
      const savedTech2 = await userRepo.save(techUser2);

      // Create two reports, one for each tech user
      const createAndAssignReport = async (title: string, assignee: UserDAO) => {
        const payload = {
          payload: {
            title,
            description: 'Description',
            categoryId: categoryId,
            images: ['http://example.com/1.jpg'],
            lat: 45.07,
            long: 7.65,
            anonymous: false,
          },
        };
        await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
        const report = await reportRepo.findOne({ where: { title } });
        report.status = ReportStatus.Assigned;
        report.assignedTo = assignee;
        await reportRepo.save(report);
      };

      await createAndAssignReport('Report for First Tech', techUser);
      await createAndAssignReport('Report for Second Tech', savedTech2);

      // First tech user should only see their report
      const res = await request(app).get('/api/reports/assigned').set('Authorization', `Bearer ${techToken}`);
      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBeGreaterThan(0);
      expect(res.body.reports.every((r: any) => r.assignedTo && r.assignedTo.id === techUserId)).toBe(true);
    });
  });
});
