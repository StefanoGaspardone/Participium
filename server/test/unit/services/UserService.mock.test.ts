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


describe("UserService.createMunicipalityUser (mock)", () => {
  it("should hash password, set office for TECHNICAL_STAFF_MEMBER and call repo.createNewUser", async () => {
    const service = new UserService();

    const fakeOffice = { id: 2, name: "Main Office" } as any;

    const createMock = jest.fn().mockImplementation(async (u: any) => ({ ...u, id: 5 }));

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      createNewUser: createMock,
      findAllUsers: jest.fn(),
      login: jest.fn(),
    };

    // @ts-ignore
    service["officeRepo"] = {
      findOfficeById: jest.fn().mockResolvedValue(fakeOffice),
    };

    const payload = {
      firstName: "Mun",
      lastName: "User",
      email: "mun@local",
      username: "mun",
      password: "s3cret",
      userType: (await import("@daos/UserDAO")).UserType.TECHNICAL_STAFF_MEMBER,
      officeId: 2,
    } as any;

    const saved = await service.createMunicipalityUser(payload);

    expect(createMock).toHaveBeenCalled();
    const passed = createMock.mock.calls[0][0] as any;
    // password should be hashed
    expect(passed.passwordHash).toBeDefined();
    expect(passed.passwordHash).not.toBe("s3cret");
    // office should be assigned
    expect(passed.office).toBeDefined();
    expect(passed.office).toEqual(fakeOffice);
    expect(saved.id).toBeDefined();
  });

  it("should throw BadRequestError when office is not found for TECHNICAL_STAFF_MEMBER", async () => {
    const service = new UserService();

    const createMock = jest.fn();

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      createNewUser: createMock,
      findAllUsers: jest.fn(),
      login: jest.fn(),
    };

    // @ts-ignore
    service["officeRepo"] = {
      findOfficeById: jest.fn().mockResolvedValue(null),
    };

    const payload = {
      firstName: "Mun",
      lastName: "NoOffice",
      email: "mun2@local",
      username: "mun2",
      password: "s3cret",
      userType: (await import("@daos/UserDAO")).UserType.TECHNICAL_STAFF_MEMBER,
      officeId: 999,
    } as any;

    await expect(service.createMunicipalityUser(payload)).rejects.toThrow("office not found.");
    // ensure createNewUser was not called
    expect(createMock).not.toHaveBeenCalled();
  });

  it("should not call officeRepo.findOfficeById when userType is not TECHNICAL_STAFF_MEMBER", async () => {
    const service = new UserService();

    const createMock = jest.fn().mockImplementation(async (u: any) => ({ ...u, id: 6 }));

    const officeFindMock = jest.fn();

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      createNewUser: createMock,
      findAllUsers: jest.fn(),
      login: jest.fn(),
    };

    // @ts-ignore
    service["officeRepo"] = {
      findOfficeById: officeFindMock,
    };

    const payload = {
      firstName: "Normal",
      lastName: "Municipal",
      email: "normal@local",
      username: "normal",
      password: "pass",
      userType: (await import("@daos/UserDAO")).UserType.CITIZEN, // not TECHNICAL_STAFF_MEMBER
      officeId: 1,
    } as any;

    const saved = await service.createMunicipalityUser(payload);

    expect(createMock).toHaveBeenCalled();
    expect(officeFindMock).not.toHaveBeenCalled();
    expect(saved.id).toBeDefined();
  });
});
