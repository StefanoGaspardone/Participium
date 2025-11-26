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
      emailNotificationsEnabled: false,
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
      emailNotificationsEnabled: true,
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

describe("UserService.updateUser (mock)", () => {
  it("should update user fields and call repo.updateUser", async () => {
    const service = new UserService();

    const existingUser = {
      id: 10,
      firstName: "Old",
      lastName: "Name",
      email: "old@email.com",
      username: "olduser",
      emailNotificationsEnabled: false,
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(existingUser);
    const updateMock = jest.fn().mockImplementation(async (u: any) => u);

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    const updateData = {
      firstName: "New",
      lastName: "Updated",
      email: "new@email.com",
      emailNotificationsEnabled: true,
    };

    const result = await service.updateUser(10, updateData);

    expect(findByIdMock).toHaveBeenCalledWith(10);
    expect(updateMock).toHaveBeenCalled();
    
    const updatedUser = updateMock.mock.calls[0][0];
    expect(updatedUser.firstName).toBe("New");
    expect(updatedUser.lastName).toBe("Updated");
    expect(updatedUser.email).toBe("new@email.com");
    expect(updatedUser.emailNotificationsEnabled).toBe(true);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const service = new UserService();

    const findByIdMock = jest.fn().mockResolvedValue(null);
    const updateMock = jest.fn();

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    await expect(service.updateUser(999, { firstName: "New" })).rejects.toThrow(
      "User with id 999 not found"
    );

    expect(findByIdMock).toHaveBeenCalledWith(999);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("should update only provided fields", async () => {
    const service = new UserService();

    const existingUser = {
      id: 11,
      firstName: "Keep",
      lastName: "This",
      email: "keep@email.com",
      username: "keepuser",
      telegramUsername: "oldtelegram",
      emailNotificationsEnabled: false,
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(existingUser);
    const updateMock = jest.fn().mockImplementation(async (u: any) => u);

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    // Update only username and image
    const updateData = {
      username: "newusername",
      image: "newimage.jpg",
    };

    await service.updateUser(11, updateData);

    expect(updateMock).toHaveBeenCalled();
    const updatedUser = updateMock.mock.calls[0][0];
    
    // These should be updated
    expect(updatedUser.username).toBe("newusername");
    expect(updatedUser.image).toBe("newimage.jpg");
    
    // These should remain unchanged
    expect(updatedUser.firstName).toBe("Keep");
    expect(updatedUser.lastName).toBe("This");
    expect(updatedUser.email).toBe("keep@email.com");
    expect(updatedUser.telegramUsername).toBe("oldtelegram");
  });

  it("should handle updating telegramUsername", async () => {
    const service = new UserService();

    const existingUser = {
      id: 12,
      telegramUsername: "oldtelegram",
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(existingUser);
    const updateMock = jest.fn().mockImplementation(async (u: any) => u);

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    await service.updateUser(12, { telegramUsername: "newtelegram" });

    expect(updateMock).toHaveBeenCalled();
    const updatedUser = updateMock.mock.calls[0][0];
    expect(updatedUser.telegramUsername).toBe("newtelegram");
  });

  it("should handle toggling emailNotificationsEnabled", async () => {
    const service = new UserService();

    const existingUser = {
      id: 13,
      emailNotificationsEnabled: false,
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(existingUser);
    const updateMock = jest.fn().mockImplementation(async (u: any) => u);

    // inject fake repos
    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    await service.updateUser(13, { emailNotificationsEnabled: true });

    expect(updateMock).toHaveBeenCalled();
    const updatedUser = updateMock.mock.calls[0][0];
    expect(updatedUser.emailNotificationsEnabled).toBe(true);
  });
});

describe("UserService.findUserByTelegramUsername (mock)", () => {
  it("should find user by telegram username and return DTO", async () => {
    const service = new UserService();

    const fakeUser = {
      id: 1,
      telegramUsername: "@testuser",
      email: "test@test.com",
      username: "testuser",
      userType: "CITIZEN",
      createdAt: new Date(),
    } as any;

    const findByTelegramMock = jest.fn().mockResolvedValue(fakeUser);

    // @ts-ignore
    service["userRepo"] = { findUserByTelegramUsername: findByTelegramMock };

    const result = await service.findUserByTelegramUsername("@testuser");

    expect(findByTelegramMock).toHaveBeenCalledWith("@testuser");
    expect(result.telegramUsername).toBe("@testuser");
  });

  it("should throw NotFoundError when user with telegram username does not exist", async () => {
    const service = new UserService();
    const findByTelegramMock = jest.fn().mockResolvedValue(null);

    // @ts-ignore
    service["userRepo"] = { findUserByTelegramUsername: findByTelegramMock };

    await expect(service.findUserByTelegramUsername("@nonexistent")).rejects.toThrow(
      "No user found with telegram username @nonexistent"
    );

    expect(findByTelegramMock).toHaveBeenCalledWith("@nonexistent");
  });
});

describe("UserService.createMunicipalityUser - Additional Cases (mock)", () => {
  it("should set Organization office for MUNICIPAL_ADMINISTRATOR and PUBLIC_RELATIONS_OFFICER", async () => {
    const service = new UserService();

    const fakeOrgOffice = { id: 1, name: "Organization" } as any;
    const createMock = jest.fn().mockImplementation(async (u: any) => ({ ...u, id: 10 }));

    // @ts-ignore
    service["userRepo"] = { createNewUser: createMock };
    // @ts-ignore
    service["officeRepo"] = { findOrganizationOffice: jest.fn().mockResolvedValue(fakeOrgOffice) };

    const { UserType } = await import("@daos/UserDAO");
    
    // Test MUNICIPAL_ADMINISTRATOR
    await service.createMunicipalityUser({
      firstName: "Municipal",
      lastName: "Admin",
      email: "munadmin@local",
      username: "munadmin",
      password: "pass",
      userType: UserType.MUNICIPAL_ADMINISTRATOR,
    } as any);

    expect(createMock).toHaveBeenCalled();
    expect(createMock.mock.calls[0][0].office).toEqual(fakeOrgOffice);

    createMock.mockClear();

    // Test PUBLIC_RELATIONS_OFFICER
    await service.createMunicipalityUser({
      firstName: "PRO",
      lastName: "Officer",
      email: "pro@local",
      username: "pro",
      password: "pass",
      userType: UserType.PUBLIC_RELATIONS_OFFICER,
    } as any);

    expect(createMock).toHaveBeenCalled();
    expect(createMock.mock.calls[0][0].office).toEqual(fakeOrgOffice);
  });

  it("should throw BadRequestError when Organization office does not exist", async () => {
    const service = new UserService();
    const createMock = jest.fn();

    // @ts-ignore
    service["userRepo"] = { createNewUser: createMock };
    // @ts-ignore
    service["officeRepo"] = { findOrganizationOffice: jest.fn().mockResolvedValue(null) };

    const { UserType } = await import("@daos/UserDAO");

    // Test MUNICIPAL_ADMINISTRATOR
    await expect(
      service.createMunicipalityUser({
        firstName: "Municipal",
        lastName: "Admin",
        email: "munadmin@local",
        username: "munadmin",
        password: "pass",
        userType: UserType.MUNICIPAL_ADMINISTRATOR,
      } as any)
    ).rejects.toThrow("Organization office not found.");

    // Test PUBLIC_RELATIONS_OFFICER
    await expect(
      service.createMunicipalityUser({
        firstName: "PRO",
        lastName: "Officer",
        email: "pro@local",
        username: "pro",
        password: "pass",
        userType: UserType.PUBLIC_RELATIONS_OFFICER,
      } as any)
    ).rejects.toThrow("Organization office not found.");

    expect(createMock).not.toHaveBeenCalled();
  });
});
