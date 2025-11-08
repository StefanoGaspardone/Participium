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

  it("/signup test", async () => {
    const newUser = {
      email: "prova@test.e2e",
      password: "password",
      firstName: "prova",
      lastName: "test",
      username: "protest",
      image: "randomUrl",
      telegramUsername: "randomUrl",
    };
    const res = await request(app).get("/api/users/signup").send(newUser);
    expect(res.status).toBe(201);
  });
});
