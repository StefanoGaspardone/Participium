import { UserService } from "@services/UserService";
import { UserDAO, UserType } from "@daos/UserDAO";
import { NewUserDTO } from "@dtos/UserDTO";

// NOSONAR - Test credentials only, not used in production
const TEST_PASSWORD = "testpass123"; // NOSONAR
const TEST_PASSWORD_HASH = "$2a$10$hashedpassword123"; // NOSONAR

describe("UserService (mock)", () => {
  it("signUpUser should hash password and call repo.signUpUser", async () => {
    const service = new UserService();

    const signUpMock = jest
      .fn()
      .mockImplementation(async (u: any) => ({ ...u, id: 2 }));
    const findAllMock = jest.fn().mockResolvedValue([]);
    const loginMock = jest.fn().mockResolvedValue(null);
    const findByIdMock = jest.fn().mockResolvedValue({ id: 2, isActive: false, save: jest.fn() });

    // inject fake repo
    // @ts-ignore
    service["userRepo"] = {
      createNewUser : signUpMock,
      findAllUsers: findAllMock,
      login: loginMock,
      findUserById: findByIdMock,
    };

    // Mock the private createCodeConfirmationForUser method
    // @ts-ignore
    service["createCodeConfirmationForUser"] = jest.fn().mockResolvedValue({});

    const payload = {
      firstName: "Mock",
      lastName: "Svc",
      email: "svc@mock",
      username: "svc",
      password: TEST_PASSWORD,
      emailNotificationsEnabled: false,
    } as NewUserDTO;

    await service.signUpUser(payload);
    expect(signUpMock).toHaveBeenCalled();
    // the object passed to signUpMock should contain a passwordHash (not plain password)
    const passed = signUpMock.mock.calls[0][0] as UserDAO;
    expect(passed.passwordHash).toBeDefined();
    expect(passed.passwordHash).not.toBe(TEST_PASSWORD);
  });

  it("login should delegate to repo.login", async () => {
    const service = new UserService();
    const fakeUser = { id: 3, email: "a@b", isActive: true } as any;
    // @ts-ignore
    service["userRepo"] = {
      createNewUser: jest.fn(),
      findAllUsers: jest.fn(),
      login: jest.fn().mockResolvedValue(fakeUser),
    };

    const out = await service.login("a@b", TEST_PASSWORD);
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
      passwordHash: TEST_PASSWORD_HASH,
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

    await expect(service.login("a@b", TEST_PASSWORD)).rejects.toThrow("repo failure");
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
      password: TEST_PASSWORD,
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
      password: TEST_PASSWORD,
      userType: (await import("@daos/UserDAO")).UserType.TECHNICAL_STAFF_MEMBER,
      officeIds: [2],
    } as any;

    const saved = await service.createMunicipalityUser(payload);

    expect(createMock).toHaveBeenCalled();
    const passed = createMock.mock.calls[0][0] as any;
    // password should be hashed
    expect(passed.passwordHash).toBeDefined();
    expect(passed.passwordHash).not.toBe(TEST_PASSWORD);
    // offices should be assigned
    expect(passed.offices).toBeDefined();
    expect(passed.offices).toEqual([fakeOffice]);
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
      password: TEST_PASSWORD,
      userType: (await import("@daos/UserDAO")).UserType.TECHNICAL_STAFF_MEMBER,
      officeIds: [999],
    } as any;

    await expect(service.createMunicipalityUser(payload)).rejects.toThrow("Office with id 999 not found.");
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
      password: TEST_PASSWORD,
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
      password: TEST_PASSWORD,
      userType: UserType.MUNICIPAL_ADMINISTRATOR,
    } as any);

    expect(createMock).toHaveBeenCalled();
    expect(createMock.mock.calls[0][0].offices).toEqual([fakeOrgOffice]);

    createMock.mockClear();

    // Test PUBLIC_RELATIONS_OFFICER
    await service.createMunicipalityUser({
      firstName: "PRO",
      lastName: "Officer",
      email: "pro@local",
      username: "pro",
      password: TEST_PASSWORD,
      userType: UserType.PUBLIC_RELATIONS_OFFICER,
    } as any);

    expect(createMock).toHaveBeenCalled();
    expect(createMock.mock.calls[0][0].offices).toEqual([fakeOrgOffice]);
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
        password: TEST_PASSWORD,
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
        password: TEST_PASSWORD,
        userType: UserType.PUBLIC_RELATIONS_OFFICER,
      } as any)
    ).rejects.toThrow("Organization office not found.");

    expect(createMock).not.toHaveBeenCalled();
  });
});

describe("UserService.findMaintainersByCategory (mock)", () => {
  it("should return maintainers mapped to DTOs for valid category", async () => {
    const service = new UserService();

    const { CategoryDAO } = require("@daos/CategoryDAO");
    const category = new CategoryDAO();
    category.id = 1;
    category.name = "Water Supply";

    const maintainer1 = {
      id: 10,
      firstName: "John",
      lastName: "Doe",
      email: "john@external.com",
      username: "johndoe",
      userType: UserType.EXTERNAL_MAINTAINER,
      company: { id: 1, name: "Company A", categories: [] },
    } as any;

    const maintainer2 = {
      id: 11,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@external.com",
      username: "janesmith",
      userType: UserType.EXTERNAL_MAINTAINER,
      company: { id: 1, name: "Company A", categories: [] },
    } as any;

    // @ts-ignore
    service['categoryRepo'] = {
      findCategoryById: jest.fn().mockResolvedValue(category),
    };

    // @ts-ignore
    service['userRepo'] = {
      findMaintainersByCategory: jest.fn().mockResolvedValue([maintainer1, maintainer2]),
    };

    const result = await service.findMaintainersByCategory(1);

    expect((service as any).categoryRepo.findCategoryById).toHaveBeenCalledWith(1);
    expect((service as any).userRepo.findMaintainersByCategory).toHaveBeenCalledWith(category);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(10);
    expect(result[1].id).toBe(11);
  });

  it("should throw NotFoundError when category does not exist", async () => {
    const service = new UserService();

    // @ts-ignore
    service['categoryRepo'] = {
      findCategoryById: jest.fn().mockResolvedValue(null),
    };

    await expect(service.findMaintainersByCategory(999)).rejects.toThrow('Category with id 999 not found');
  });

  it("should return empty array when no maintainers exist for category", async () => {
    const service = new UserService();

    const { CategoryDAO } = require("@daos/CategoryDAO");
    const category = new CategoryDAO();
    category.id = 2;
    category.name = "Public Lighting";

    // @ts-ignore
    service['categoryRepo'] = {
      findCategoryById: jest.fn().mockResolvedValue(category),
    };

    // @ts-ignore
    service['userRepo'] = {
      findMaintainersByCategory: jest.fn().mockResolvedValue([]),
    };

    const result = await service.findMaintainersByCategory(2);

    expect(result).toEqual([]);
  });
});

describe("UserService.createMunicipalityUser - External Maintainer (mock)", () => {
  it("should create external maintainer with valid companyId", async () => {
    const service = new UserService();

    const fakeCompany = { id: 1, name: "External Company A" } as any;
    const createMock = jest.fn().mockImplementation(async (u: any) => ({ ...u, id: 20 }));

    // @ts-ignore
    service['userRepo'] = {
      createNewUser: createMock,
    };

    // @ts-ignore
    service['companyRepository'] = {
      findCompanyById: jest.fn().mockResolvedValue(fakeCompany),
    };

    const payload = {
      firstName: "External",
      lastName: "Maintainer",
      email: "external@company.com",
      username: "extmaint",
      password: TEST_PASSWORD,
      userType: UserType.EXTERNAL_MAINTAINER,
      companyId: 1,
    } as any;

    const saved = await service.createMunicipalityUser(payload);

    expect((service as any).companyRepository.findCompanyById).toHaveBeenCalledWith(1);
    expect(createMock).toHaveBeenCalled();
    const createdUser = createMock.mock.calls[0][0];
    expect(createdUser.company).toEqual(fakeCompany);
    expect(saved.id).toBe(20);
  });

  it("should throw BadRequestError when company does not exist", async () => {
    const service = new UserService();

    const createMock = jest.fn();

    // @ts-ignore
    service['userRepo'] = {
      createNewUser: createMock,
    };

    // @ts-ignore
    service['companyRepository'] = {
      findCompanyById: jest.fn().mockResolvedValue(null),
    };

    const payload = {
      firstName: "External",
      lastName: "Maintainer",
      email: "external@company.com",
      username: "extmaint",
      password: TEST_PASSWORD,
      userType: UserType.EXTERNAL_MAINTAINER,
      companyId: 999,
    } as any;

    await expect(service.createMunicipalityUser(payload)).rejects.toThrow("Company not found.");
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe("UserService.findTechnicalStaffMembers (mock)", () => {
  it("should find all TSM users and map them to DTOs", async () => {
    const service = new UserService();

    const fakeOffice1 = { id: 1, name: "Office A" } as any;
    const fakeOffice2 = { id: 2, name: "Office B" } as any;

    const fakeTSM1 = {
      id: 1,
      firstName: "John",
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      offices: [fakeOffice1],
      createdAt: new Date(),
    } as any;

    const fakeTSM2 = {
      id: 2,
      firstName: "Jane",
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      offices: [fakeOffice1, fakeOffice2],
      createdAt: new Date(),
    } as any;

    const findTSMMock = jest.fn().mockResolvedValue([fakeTSM1, fakeTSM2]);

    // @ts-ignore
    service["userRepo"] = {
      findTechnicalStaffMembers: findTSMMock,
    };

    const result = await service.findTechnicalStaffMembers();

    expect(findTSMMock).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[0].firstName).toBe("John");
    expect(result[0].offices).toEqual(["Office A"]);
    expect(result[1].id).toBe(2);
    expect(result[1].firstName).toBe("Jane");
    expect(result[1].offices).toEqual(["Office A", "Office B"]);
  });

  it("should return empty array when no TSM users exist", async () => {
    const service = new UserService();

    const findTSMMock = jest.fn().mockResolvedValue([]);

    // @ts-ignore
    service["userRepo"] = {
      findTechnicalStaffMembers: findTSMMock,
    };

    const result = await service.findTechnicalStaffMembers();

    expect(findTSMMock).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

describe("UserService.updateTsm (mock)", () => {
  it("should update TSM offices successfully", async () => {
    const service = new UserService();

    const fakeOffice1 = { id: 1, name: "Office A" } as any;
    const fakeOffice2 = { id: 2, name: "Office B" } as any;

    const fakeTSM = {
      id: 1,
      firstName: "John",
      lastName: "Smith",
      username: "jsmith",
      email: "jsmith@test.com",
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      offices: [],
      createdAt: new Date(),
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(fakeTSM);
    const updateMock = jest.fn().mockImplementation(async (u: any) => u);

    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    // @ts-ignore
    service["officeRepo"] = {
      findOfficeById: jest
        .fn()
        .mockImplementation(async (id: number) => {
          if (id === 1) return fakeOffice1;
          if (id === 2) return fakeOffice2;
          return null;
        }),
    };

    const result = await service.updateTsm(1, [1, 2]);

    expect(findByIdMock).toHaveBeenCalledWith(1);
    expect(updateMock).toHaveBeenCalled();

    const updatedUser = updateMock.mock.calls[0][0];
    expect(updatedUser.offices).toHaveLength(2);
    expect(result.offices).toEqual(["Office A", "Office B"]);
  });

  it("should throw NotFoundError when TSM does not exist", async () => {
    const service = new UserService();

    const findByIdMock = jest.fn().mockResolvedValue(null);

    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
    };

    await expect(service.updateTsm(999, [1])).rejects.toThrow(
      "Technical staff member with id 999 not found"
    );

    expect(findByIdMock).toHaveBeenCalledWith(999);
  });

  it("should throw BadRequestError when user is not a TSM", async () => {
    const service = new UserService();

    const fakeUser = {
      id: 1,
      firstName: "Regular",
      lastName: "User",
      userType: UserType.CITIZEN,
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(fakeUser);

    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
    };

    await expect(service.updateTsm(1, [1])).rejects.toThrow(
      "User with id 1 is not a technical staff member"
    );

    expect(findByIdMock).toHaveBeenCalledWith(1);
  });

  it("should throw BadRequestError when office does not exist", async () => {
    const service = new UserService();

    const fakeTSM = {
      id: 1,
      firstName: "John",
      lastName: "Smith",
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      offices: [],
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(fakeTSM);
    const updateMock = jest.fn();

    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    // @ts-ignore
    service["officeRepo"] = {
      findOfficeById: jest.fn().mockResolvedValue(null),
    };

    await expect(service.updateTsm(1, [999])).rejects.toThrow(
      "Office with id 999 not found."
    );

    expect(findByIdMock).toHaveBeenCalledWith(1);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("should clear existing offices and set new ones", async () => {
    const service = new UserService();

    const fakeOffice1 = { id: 1, name: "Office A" } as any;
    const fakeOffice2 = { id: 2, name: "Office B" } as any;
    const fakeOffice3 = { id: 3, name: "Office C" } as any;

    const fakeTSM = {
      id: 1,
      firstName: "John",
      lastName: "Smith",
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      offices: [fakeOffice1, fakeOffice2], // Initially has Office A and B
      createdAt: new Date(),
    } as any;

    const findByIdMock = jest.fn().mockResolvedValue(fakeTSM);
    const updateMock = jest.fn().mockImplementation(async (u: any) => u);

    // @ts-ignore
    service["userRepo"] = {
      findUserById: findByIdMock,
      updateUser: updateMock,
    };

    // @ts-ignore
    service["officeRepo"] = {
      findOfficeById: jest
        .fn()
        .mockImplementation(async (id: number) => {
          if (id === 3) return fakeOffice3;
          return null;
        }),
    };

    const result = await service.updateTsm(1, [3]); // Update to only Office C

    expect(updateMock).toHaveBeenCalled();
    const updatedUser = updateMock.mock.calls[0][0];
    expect(updatedUser.offices).toHaveLength(1);
    expect(result.offices).toEqual(["Office C"]);
  });
});

