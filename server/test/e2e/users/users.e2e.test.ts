import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";

describe("Users e2e tests : Login and Registration", () => {
  let token: string;

  beforeAll(async () => {
    await f.default.beforeAll();
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  it("/signup test => status 201 (user registered, with all fields)", async () => {
    const newUser = {
      email: "prova@test.e2e",
      password: "password",
      firstName: "prova",
      lastName: "test",
      username: "protest",
      image: "randomUrl",
      telegramUsername: "randomUrl",
      emailNotificationsEnabled: true,
    };
    const res = await request(app).post("/api/users/signup").send(newUser);
    expect(res.status).toBe(201);
  });

  it("/signup test => status 409 (conflict if email already registered)", async () => {
    const newUser = {
      email: "user@gmail.com",
      password: "password",
      firstName: "prova",
      lastName: "test",
      username: "protest",
      image: "randomUrl",
      telegramUsername: "randomUrl",
      emailNotificationsEnabled: false,
    };
    const res = await request(app).post("/api/users/signup").send(newUser);
    expect(res.status).toBe(409);
  });

  it("/signup test => status 201 (user registered, without image and tg username)", async () => {
    const newUser = {
      email: "user2@gmail.com",
      password: "password",
      firstName: "prova2",
      lastName: "test2",
      username: "protest2",
      emailNotificationsEnabled: false,
    };
    const res = await request(app).post("/api/users/signup").send(newUser);
    expect(res.status).toBe(201);
  });

  it("/login test => status 200 (user enters right credentials)", async () => {
    const credentials = {
      username: "user",
      password: "user",
    };
    const res = await request(app).post("/api/users/login").send(credentials);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it("/login test ", async () => {
    const credentials = {
      username: "wronguser",
      password: "notexistent",
    };
    const res = await request(app).post("/api/users/login").send(credentials);
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty("token");
  });

  it("/employees (create municipality user) => 201 with admin token", async () => {
    // login as admin (populated by lifecycle)
    const loginRes = await request(app).post('/api/users/login').send({ username: 'admin', password: 'admin' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    // pick an existing office
    const officesRes = await request(app).get('/api/offices');
    expect(officesRes.status).toBe(200);
    const officeList = officesRes.body as any[];
    expect(Array.isArray(officeList)).toBe(true);
    const officeId = officeList.length ? officeList[0].id : 1;

    const newMuni = {
      email: 'e2e_muni@example.com',
      password: 'munipass',
      firstName: 'E2E',
      lastName: 'Municipal',
      username: 'e2emuni',
      userType: 'TECHNICAL_STAFF_MEMBER',
      officeId,
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(newMuni);

    expect(res.status).toBe(201);
  });

  it("/employees => 400 when TECHNICAL_STAFF_MEMBER missing officeId (admin token)", async () => {
    // login as admin
    const loginRes = await request(app).post('/api/users/login').send({ username: 'admin', password: 'admin' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    const badPayload = {
      email: 'e2e_muni_no_office@example.com',
      password: 'munipass',
      firstName: 'E2E',
      lastName: 'NoOffice',
      username: 'e2emuni_no_office',
      userType: 'TECHNICAL_STAFF_MEMBER',
      // officeId intentionally omitted
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(badPayload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/missing office id/);
  });

  it('/login for municipality user => 200 and returns token', async () => {
    const credentials = { username: 'e2emuni', password: 'munipass' };
    const res = await request(app).post('/api/users/login').send(credentials);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('GET /api/users should include the created municipality user with office and role', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    const users = res.body.users as any[];
    const found = users.find(u => u.email === 'e2e_muni@example.com');
    expect(found).toBeDefined();
    expect(found.userType).toBe('TECHNICAL_STAFF_MEMBER');
    expect(found.office).toBeDefined();
  });

  it('POST /api/users/employees => 403 with non-admin token (e2e)', async () => {
    // login as normal (non-admin) user from populated test data
    const loginRes = await request(app).post('/api/users/login').send({ username: 'user', password: 'user' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    // pick an existing office
    const officesRes = await request(app).get('/api/offices');
    expect(officesRes.status).toBe(200);
    const officeList = officesRes.body as any[];
    const officeId = officeList.length ? officeList[0].id : 1;

    const payload = {
      email: 'e2e_nonadmin_attempt@example.com',
      password: 'munipass',
      firstName: 'E2E',
      lastName: 'Attempt',
      username: 'e2e_nonadmin',
      userType: 'TECHNICAL_STAFF_MEMBER',
      officeId,
    };

    const res = await request(app)
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(String(res.body.message).toLowerCase()).toMatch(/insufficient|permission/);
  });
});

describe("Users e2e tests : Update User Profile", () => {
  let citizenToken: string;

  beforeAll(async () => {
    await f.default.beforeAll();

    // Create a citizen user for update tests
    const newUser = {
      email: "updatetest@test.e2e",
      password: "password",
      firstName: "Update",
      lastName: "Test",
      username: "updatetest",
      emailNotificationsEnabled: false,
    };
    await request(app).post("/api/users/signup").send(newUser);

    // Login to get token
    const loginRes = await request(app).post('/api/users/login').send({
      username: 'updatetest',
      password: 'password'
    });
    citizenToken = loginRes.body.token;

    // Create another citizen for conflict tests
    const anotherUser = {
      email: "another@test.e2e",
      password: "password",
      firstName: "Another",
      lastName: "User",
      username: "anotherupdate",
      emailNotificationsEnabled: true,
    };
    await request(app).post("/api/users/signup").send(anotherUser);
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  it("PATCH /users/me => 200 (successfully update own profile)", async () => {
    const updatePayload = {
      firstName: "UpdatedName",
      lastName: "UpdatedLast",
      emailNotificationsEnabled: true,
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User updated successfully');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.firstName).toBe('UpdatedName');
    expect(res.body.user.lastName).toBe('UpdatedLast');
    expect(res.body.user.emailNotificationsEnabled).toBe(true);
  });

  it("PATCH /users/me => 200 (update telegram username)", async () => {
    const updatePayload = {
      telegramUsername: "newtelegram",
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User updated successfully');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.telegramUsername).toBe('newtelegram');
  });

  it("PATCH /users/me => 200 (update email and username)", async () => {
    const updatePayload = {
      email: "newemail@test.e2e",
      username: "newusername",
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User updated successfully');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('newemail@test.e2e');
    expect(res.body.user.username).toBe('newusername');
  });

  it("PATCH /users/me => 400 (trying to update invalid field)", async () => {
    const updatePayload = {
      userType: "ADMINISTRATOR", // Not allowed
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(updatePayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be updated/i);
  });

  it("PATCH /users/me => 400 (empty field validation)", async () => {
    const updatePayload = {
      firstName: "",
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(updatePayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be empty/i);
  });

  it("PATCH /users/me => 409 (conflict when email already exists)", async () => {
    const updatePayload = {
      email: "another@test.e2e", // Email of anotherCitizen
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(updatePayload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("PATCH /users/me => 409 (conflict when username already exists)", async () => {
    const updatePayload = {
      username: "anotherupdate", // Username of anotherCitizen
    };

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(updatePayload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("PATCH /users/me => 401 (no authentication token)", async () => {
    const updatePayload = {
      firstName: "NoAuth",
    };

    const res = await request(app)
      .patch('/api/users/me')
      .send(updatePayload);

    expect(res.status).toBe(401);
  });
});
