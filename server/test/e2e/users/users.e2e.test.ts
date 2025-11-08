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
    };
    const res = await request(app).post("/api/users/signup").send(newUser);
    expect(res.status).toBe(201);
  });

  it("/login test => status 200 (user enters right credentials)", async () => {
    const credentials = {
      email: "user@gmail.com",
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
      email: "wrong@mail.bad",
      password: "notexistent",
    };
    const res = await request(app).post("/api/users/login").send(credentials);
    expect(res.status).toBe(401);
    expect(res).not.toHaveProperty("token");
  });
});
