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

  it("GET /api/categories => 200 without authentication", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  it("GET /api/categories => 200 and returns seeded categories", async () => {
    // read canonical categories from DB (seeded by lifecycle)
    const repo = AppDataSource.getRepository(CategoryDAO);
    const categories = await repo.find();
    expect(categories.length).toBeGreaterThan(0);

    const res = await request(app).get('/api/categories');
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
    const res = await request(app).get('/api/categories');
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
