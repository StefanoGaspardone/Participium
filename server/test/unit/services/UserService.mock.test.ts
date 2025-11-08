import { UserService } from "@services/UserService";
import { UserDAO } from "@daos/UserDAO";
import { NewUserDTO } from "@dtos/UserDTO";

describe("UserService (mock)", () => {
  it("signUpUser should hash password and call repo.signUpUser", async () => {
    const service = new UserService();

    const signUpMock = jest
      .fn()
      .mockImplementation(async (u: any) => ({ ...u, id: 2 }));
    const findAllMock = jest.fn().mockResolvedValue([]);
    const loginMock = jest.fn().mockResolvedValue(null);

    // inject fake repo
    // @ts-ignore
    service["userRepo"] = {
      createNewUser : signUpMock,
      findAllUsers: findAllMock,
      login: loginMock,
    };

    const payload = {
      firstName: "Mock",
      lastName: "Svc",
      email: "svc@mock",
      username: "svc",
      password: "secretpw",
    } as NewUserDTO;

    const saved = await service.signUpUser(payload);
    expect(signUpMock).toHaveBeenCalled();
    // the object passed to signUpMock should contain a passwordHash (not plain password)
    const passed = signUpMock.mock.calls[0][0] as UserDAO;
    expect(passed.passwordHash).toBeDefined();
    expect(passed.passwordHash).not.toBe("secretpw");
    expect(saved.id).toBeDefined();
  });

  it("login should delegate to repo.login", async () => {
    const service = new UserService();
    const fakeUser = { id: 3, email: "a@b" } as any;
    // @ts-ignore
    service["userRepo"] = {
      createNewUser: jest.fn(),
      findAllUsers: jest.fn(),
      login: jest.fn().mockResolvedValue(fakeUser),
    };

    const out = await service.login("a@b", "pw");
    expect(out).toEqual(fakeUser);
  });

  it("findAllUsers should map DAOs to DTOs", async () => {
    const service = new UserService();
    const dao = {
      id: 1,
      firstName: "A",
      lastName: "B",
      email: "x@y",
      username: "x",
      image: null,
      telegramUsername: null,
      userType: "CITIZEN",
      municipalityRole: null,
      createdAt: new Date().toISOString(),
      passwordHash: "h",
    } as any;

    // @ts-ignore
    service["userRepo"] = {
      createNewUser: jest.fn(),
      findAllUsers: jest.fn().mockResolvedValue([dao]),
      login: jest.fn(),
    };

    const list = await service.findAllUsers();
    expect(Array.isArray(list)).toBe(true);
    expect((list[0] as any).email).toBe("x@y");
  });

  it("login throws error if repo.login throws error", async () => {
    const service = new UserService();
    // @ts-ignore
    service["userRepo"] = {
      createNewUser: jest.fn(),
      findAllUsers: jest.fn(),
      login: jest.fn().mockRejectedValue(new Error("repo failure")),
    };

    await expect(service.login("a@b", "pw")).rejects.toThrow("repo failure");
  });

  it("signUp throws error if repo.signUp throws error", async () => {
    const service = new UserService();

    const signUpMock = jest.fn().mockRejectedValue(new Error("repo failure"));
    const findAllMock = jest.fn().mockResolvedValue([]);
    const loginMock = jest.fn().mockResolvedValue(null);

    // inject fake repo
    // @ts-ignore
    service["userRepo"] = {
      createNewUser: signUpMock,
      findAllUsers: findAllMock,
      login: loginMock,
    };

    const payload = {
      firstName: "Mock",
      lastName: "Svc",
      email: "svc@mock",
      username: "svc",
      password: "secretpw",
    } as NewUserDTO;

    await expect(service.signUpUser(payload)).rejects.toThrow("repo failure");
  });
});
