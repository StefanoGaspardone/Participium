import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { ReportDAO } from '@daos/ReportDAO';
import { CONFIG } from '@config';
import * as bcrypt from 'bcryptjs';

describe('Report routes integration tests', () => {
  let categoryId: number | undefined;
  let AppDataSource: any;
  let token: string;

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

    // login once and cache token for tests
    const login = await request(app).post('/api/users/login').send({ email: 'citizen_user@gmail.com', password: 'citizen' });
    expect(login.status).toBe(200);
    token = login.body.token as string;
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
    const login = await request(app).post('/api/users/login').send({ email: 'citizen_user@gmail.com', password: 'citizen' });
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
    const login = await request(app).post('/api/users/login').send({ email: 'citizen_user@gmail.com', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Boundary coords',
        description: 'Using boundary latitude and longitude',
        categoryId: categoryId,
        images: ['http://example.com/1.jpg'],
        lat: CONFIG.TURIN.MIN_LAT,
        long: CONFIG.TURIN.MAX_LONG,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(201);
  });

  it('POST /api/reports => 400 when lat is below minimum', async () => {
    const login = await request(app).post('/api/users/login').send({ email: 'citizen_user@gmail.com', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Bad lat',
        description: 'Latitude too small',
        categoryId: categoryId,
        images: ['http://example.com/1.jpg'],
        lat: CONFIG.TURIN.MIN_LAT - 0.001,
        long: CONFIG.TURIN.MIN_LONG,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('lat');
  });

  it('POST /api/reports => 400 when long is above maximum', async () => {
    const login = await request(app).post('/api/users/login').send({ email: 'citizen_user@gmail.com', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Bad long',
        description: 'Longitude too large',
        categoryId: categoryId,
        images: ['http://example.com/1.jpg'],
        lat: CONFIG.TURIN.MIN_LAT,
        long: CONFIG.TURIN.MAX_LONG + 0.001,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('long');
  });

  it('POST /api/reports => 404 when categoryId does not exist', async () => {
    const login = await request(app).post('/api/users/login').send({ email: 'citizen_user@gmail.com', password: 'citizen' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const payload = {
      payload: {
        title: 'Unknown category',
        description: 'Category id does not exist',
        categoryId: 999999, // non existing
        images: ['http://example.com/1.jpg'],
        lat: CONFIG.TURIN.MIN_LAT,
        long: CONFIG.TURIN.MIN_LONG,
        anonymous: false,
      },
    };

    const res = await request(app).post('/api/reports').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/not found/);
  });
});
