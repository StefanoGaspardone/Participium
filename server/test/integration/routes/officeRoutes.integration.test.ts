import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { app } from '@app';
import request from 'supertest';
import { OfficeDAO } from '@daos/OfficeDAO';
import * as bcrypt from 'bcryptjs';

describe('Office routes integration tests', () => {
  let AppDataSource: any;

  beforeAll(async () => {
    AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const officeRepo = AppDataSource.getRepository(OfficeDAO);

    const o1 = officeRepo.create({ name: 'Public Services Division' });
    const o2 = officeRepo.create({ name: 'Infrastructure Division' });
    await officeRepo.save(o1);
    await officeRepo.save(o2);
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('GET /api/offices => 200 and returns offices array', async () => {
    const res = await request(app).get('/api/offices');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const names = (res.body as any[]).map((o) => o.name);
    expect(names).toContain('Public Services Division');
    expect(names).toContain('Infrastructure Division');
  });
});
