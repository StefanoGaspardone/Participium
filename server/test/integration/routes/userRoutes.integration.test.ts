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
    };
    const res = await request(app).post('/api/users/signup').send(newUser);
    expect(res.status).toBe(201);
  });

  it('POST /api/users/login => 200 and returns token', async () => {
    const credentials = { email: 'self_user@gmail.com', password: 'user' };
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
    const payload = { email: 'self_user@gmail.com' };
    const res = await request(app).post('/api/users/login').send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message)).toMatch(/Email and password are required/);
  });

  it('POST /api/users/createMunicipalityUser => 401 without token', async () => {
    const payload = {
      email: 'self_muni1@example.com',
      password: 'password',
      firstName: 'Muni',
      lastName: 'One',
      username: 'selfmuni1',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      officeId: roleId,
    };
    const res = await request(app).post('/api/users/createMunicipalityUser').send(payload);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/denied|token/);
  });

  it('POST /api/users/createMunicipalityUser => 201 with admin token', async () => {
    const login = await request(app).post('/api/users/login').send({ email: 'self_admin@gmail.com', password: 'admin' });
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
      .post('/api/users/createMunicipalityUser')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
  });

  it('POST /api/users/createMunicipalityUser => 400 with admin token when missing mandatory fields', async () => {
    const login = await request(app).post('/api/users/login').send({ email: 'self_admin@gmail.com', password: 'admin' });
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
      .post('/api/users/createMunicipalityUser')
      .set('Authorization', `Bearer ${token}`)
      .send(incomplete);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/missing|required/);
  });

  it('POST /api/users/createMunicipalityUser => 403 with non-admin token', async () => {
    const login = await request(app).post('/api/users/login').send({ email: 'self_user@gmail.com', password: 'user' });
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
      .post('/api/users/createMunicipalityUser')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/insufficient|permission/);
  });
});