import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { AppDataSource } from "@database";
import { CategoryDAO } from "@daos/CategoryDAO";

describe("Categories e2e tests", () => {
  beforeAll(async () => {
    await f.default.beforeAll();
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  it("GET /api/categories => 401 without token", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(401);
  });

  it("GET /api/categories => 200 and returns seeded categories (authenticated)", async () => {
    // read canonical categories from DB (seeded by lifecycle)
    const repo = AppDataSource.getRepository(CategoryDAO);
    const categories = await repo.find();
    expect(categories.length).toBeGreaterThan(0);

    // login as seeded user
    const login = await request(app).post('/api/users/login').send({ username: 'user', password: 'user' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    expect(Array.isArray(res.body.categories)).toBe(true);

    const namesFromDb = categories.map((c) => (c.name || '').toString().trim());
    const namesFromRes = (res.body.categories as Array<any>).map((r) => (r.name || '').toString().trim());

    for (const n of namesFromDb) {
      expect(namesFromRes).toContain(n);
    }
  });

  it("GET /api/categories => response DTO shape (id:number, name:string)", async () => {
    // login and fetch categories
    const login = await request(app).post('/api/users/login').send({ username: 'user', password: 'user' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    expect(Array.isArray(res.body.categories)).toBe(true);

    for (const item of res.body.categories) {
      // id: numeric, integer, positive
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('number');
      expect(Number.isInteger(item.id)).toBe(true);
      expect(item.id).toBeGreaterThan(0);

      // name: non-empty string
      expect(item).toHaveProperty('name');
      expect(typeof item.name).toBe('string');
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
  });
});
