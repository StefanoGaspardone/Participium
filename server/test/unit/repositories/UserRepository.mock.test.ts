import { UserRepository } from "@repositories/UserRepository";
import { UserDAO, UserType } from "@daos/UserDAO";

describe("UserRepository (mock)", () => {
  it("signUpUser should call underlying repo.save and return value", async () => {
    const saveMock = jest.fn().mockResolvedValue((u: any) => ({ ...u, id: 1 }));
    // Mock AppDataSource.getRepository to return an object that has save/find/findOneBy
    const fakeRepo: any = {
      save: jest.fn().mockImplementation(async (u: any) => ({ ...u, id: 1 })),
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
    };

    // Spy on module AppDataSource.getRepository used by the repository class
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();

    const u = new UserDAO();
    u.firstName = "Mock";
    u.lastName = "User";
    u.email = "mock@example.com";
    u.username = "mock";
    u.userType = UserType.CITIZEN;
    u.passwordHash = "hashed";
    u.createdAt = new Date();

    const saved = await repo.signUpUser(u);
    expect(fakeRepo.save).toHaveBeenCalled();
    expect(saved.id).toBeDefined();
  });

  it("findAllUsers should call underlying repo.find", async () => {
    const fakeRepo: any = {
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([{ id: 1, email: "a@b" }]),
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const users = await repo.findAllUsers();
    expect(fakeRepo.find).toHaveBeenCalled();
    expect(users.length).toBeGreaterThanOrEqual(1);
  });

  it("login should call findOneBy and compare password", async () => {
    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash("pw", 10);
    const fakeRepo: any = {
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest
        .fn()
        .mockResolvedValue({ id: 1, email: "t@t", passwordHash: hashed }),
    };
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const ok = await repo.login("t@t", "pw");
    expect(fakeRepo.findOneBy).toHaveBeenCalled();
    expect(ok).not.toBeNull();
  });

  it("login should call findOneBy, compare (wrong) password and fail", async () => {
    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash("pass", 10);
    const fakeRepo: any = {
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest
        .fn()
        .mockResolvedValue({ id: 1, email: "t@t", passwordHash: "wrongone" }),
    };
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const ok = await repo.login("t@t", "pass");
    expect(fakeRepo.findOneBy).toHaveBeenCalled();
    expect(ok).toBeNull();
  });

  it("login should call findOneBy, BUT not comparing the password beacuse user is not found", async () => {
    const fakeRepo: any = {
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest
        .fn()
        .mockResolvedValue(null),
    };
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const ok = await repo.login("t@t", "pass");
    expect(fakeRepo.findOneBy).toHaveBeenCalled();
    expect(ok).toBeNull();
  });
});
