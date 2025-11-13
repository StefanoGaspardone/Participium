import { initializeTestDatasource, populateTestData, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { CategoryDAO } from '@daos/CategoryDAO';

// we will import the database module lazily in tests when we need to clear only categories
import { app } from '@app';
import request from 'supertest';

describe('Category Routes integration tests', () => {
  beforeAll(async () => {
    await initializeTestDatasource();
    // populate canonical offices, categories and users
    await populateTestData();
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('GET /api/categories => 401 without token', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('GET /api/categories => 200 with token and returns categories array', async () => {
    // login as seeded user
    const login = await request(app).post('/api/users/login').send({ username: 'user', password: 'user' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    expect(Array.isArray(res.body.categories)).toBe(true);

    // canonical category names from test-datasource
    const names = res.body.categories.map((c: any) => c.name);
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('Water Supply - Drinking Water');
    expect(names).toContain('Public Lighting');
  });

//   it('GET /api/categories => 200 and empty array when no categories exist (authenticated)', async () => {
//     // login as seeded user
//     const login = await request(app).post('/api/users/login').send({ email: 'user@gmail.com', password: 'user' });
//     expect(login.status).toBe(200);
//     const token = login.body.token as string;

//   // clear any reports that may reference categories, then remove categories
//   const db = await import('@database');
//   const AppDataSource = db.AppDataSource;
//   const { ReportDAO } = await import('@daos/ReportDAO');
//   const reportRepo = AppDataSource.getRepository(ReportDAO);
//   // delete reports first to avoid FK constraint errors
//   await reportRepo.createQueryBuilder().delete().execute();

//   const categoryRepo = AppDataSource.getRepository(CategoryDAO);
//   // delete categories (row-by-row DELETE via query builder)
//   await categoryRepo.createQueryBuilder().delete().execute();

//     const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${token}`);
//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty('categories');
//     expect(Array.isArray(res.body.categories)).toBe(true);
//     expect(res.body.categories.length).toBe(0);
//   });
});
