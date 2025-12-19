import { UserRepository } from "@repositories/UserRepository";
import { UserDAO, UserType } from "@daos/UserDAO";

// NOSONAR - Test credentials only, not used in production
const TEST_PASSWORD = "testpass123"; // NOSONAR
const TEST_PASSWORD_HASH = "$2a$10$hashedpassword123"; // NOSONAR

describe("UserRepository (mock)", () => {
  it("signUpUser should call underlying repo.save and return value", async () => {
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
    u.passwordHash = TEST_PASSWORD_HASH;
    u.createdAt = new Date();

    const saved = await repo.createNewUser(u);
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

  it("login should call findOne (with relations) and compare password", async () => {
    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
    const fakeRepo: any = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 1, email: "t@t", passwordHash: hashed }),
    };
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const ok = await repo.login("t@t", TEST_PASSWORD);
    expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { username: "t@t" }, relations: ["offices", "company", "company.categories"] });
    expect(ok).not.toBeNull();
  });

  it("login should call findOne, compare (wrong) password and fail", async () => {
    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
    const fakeRepo: any = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 1, email: "t@t", passwordHash: "wrongone" }),
    };
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const ok = await repo.login("t@t", TEST_PASSWORD);
    expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { username: "t@t" }, relations: ["offices", "company", "company.categories"] });
    expect(ok).toBeNull();
  });

  it("login should call findOne, BUT not compare the password because user is not found", async () => {
    const fakeRepo: any = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const ok = await repo.login("t@t", TEST_PASSWORD);
    expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { username: "t@t" }, relations: ["offices", "company", "company.categories"] });
    expect(ok).toBeNull();
  });
});

describe("UserRepository.findUserById and updateUser (mock)", () => {
  it("findUserById should call findOne and return user", async () => {
    const fakeUser = {
      id: 5,
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      username: "testuser",
    } as any;

    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(fakeUser),
    };

    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const user = await repo.findUserById(5);

    expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 }, "relations": ["offices",  "company",  "company.categories"], });
    expect(user).toEqual(fakeUser);
  });

  it("findUserById should return null if user not found", async () => {
    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const user = await repo.findUserById(999);

    expect(user).toBeNull();
  });

  it("updateUser should call update and return updated user", async () => {
    const userToUpdate = {
      id: 10,
      firstName: "Updated",
      lastName: "Name",
      email: "updated@test.com",
      username: "updateduser",
      userType: UserType.CITIZEN,
      passwordHash: TEST_PASSWORD_HASH,
      createdAt: new Date(),
      emailNotificationsEnabled: true,
    } as any;

    const fakeRepo: any = {
      save: jest.fn().mockResolvedValue(userToUpdate),
    };

    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const result = await repo.updateUser(userToUpdate);

    expect(fakeRepo.save).toHaveBeenCalledWith(userToUpdate);
    expect(result).toEqual(userToUpdate);
  });

  it("updateUser should throw error if user not found after update", async () => {
    const userToUpdate = {
      id: 999,
      firstName: "Ghost",
      lastName: "User",
      email: "ghost@test.com",
      username: "ghostuser",
      userType: UserType.CITIZEN,
      passwordHash: TEST_PASSWORD_HASH,
      createdAt: new Date(),
    } as any;

    const fakeRepo: any = {
      save: jest.fn().mockResolvedValue(null),
    };

    const database = require("@database");
    jest
      .spyOn(database.AppDataSource, "getRepository")
      .mockImplementation(() => fakeRepo);

    const repo = new UserRepository();

    await expect(repo.updateUser(userToUpdate)).rejects.toThrow(
      "User with id 999 not found"
    );

    expect(fakeRepo.save).toHaveBeenCalledWith(userToUpdate);
  });
});

describe("UserRepository.findUserByTelegramUsername (mock)", () => {
  it("should call findOne and return user when telegram username exists", async () => {
    const fakeUser = {
      id: 1,
      telegramUsername: "@testuser",
      email: "test@test.com",
    } as any;

    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(fakeUser),
    };

    const database = require("@database");
    jest.spyOn(database.AppDataSource, "getRepository").mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const user = await repo.findUserByTelegramUsername("@testuser");

    expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { telegramUsername: "@testuser" } });
    expect(user).toEqual(fakeUser);
  });

  it("should return null when telegram username does not exist", async () => {
    const fakeRepo: any = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const database = require("@database");
    jest.spyOn(database.AppDataSource, "getRepository").mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const user = await repo.findUserByTelegramUsername("@nonexistent");

    expect(user).toBeNull();
  });
});

describe("UserRepository.findLeastLoadedStaffForOffice (mock)", () => {
  const createFakeQueryBuilder = (entities: any[]) => ({
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities }),
  });

  it("should return technical staff member with least active reports", async () => {
    const fakeStaff = {
      id: 1,
      username: "techstaff",
      userType: UserType.TECHNICAL_STAFF_MEMBER,
    } as any;

    const fakeQueryBuilder = createFakeQueryBuilder([fakeStaff]);
    const fakeRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(fakeQueryBuilder),
    };

    const database = require("@database");
    jest.spyOn(database.AppDataSource, "getRepository").mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const result = await repo.findLeastLoadedStaffForOffice(1);

    expect(fakeRepo.createQueryBuilder).toHaveBeenCalledWith('u');
    expect(result).toEqual(fakeStaff);
  });

  it("should return null when no technical staff exists for office", async () => {
    const fakeQueryBuilder = createFakeQueryBuilder([]);
    const fakeRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(fakeQueryBuilder),
    };

    const database = require("@database");
    jest.spyOn(database.AppDataSource, "getRepository").mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const result = await repo.findLeastLoadedStaffForOffice(999);

    expect(result).toBeNull();
  });
});

describe("UserRepository.findMaintainersByCategory (mock)", () => {
  const createFakeQueryBuilder = (returnValue: any) => ({
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(returnValue),
  });

  it("should return external maintainers for a valid category", async () => {
    const { CategoryDAO } = require("@daos/CategoryDAO");
    const category = new CategoryDAO();
    category.id = 1;
    category.name = "Water Supply";

    const maintainer1 = new UserDAO();
    maintainer1.id = 10;
    maintainer1.firstName = "John";
    maintainer1.lastName = "Doe";
    maintainer1.userType = UserType.EXTERNAL_MAINTAINER;

    const maintainer2 = new UserDAO();
    maintainer2.id = 11;
    maintainer2.firstName = "Jane";
    maintainer2.lastName = "Smith";
    maintainer2.userType = UserType.EXTERNAL_MAINTAINER;

    const fakeQueryBuilder = createFakeQueryBuilder([maintainer1, maintainer2]);
    const fakeRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(fakeQueryBuilder),
    };

    const database = require("@database");
    jest.spyOn(database.AppDataSource, "getRepository").mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const result = await repo.findMaintainersByCategory(category);

    expect(fakeRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(fakeQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('user.company', 'company');
    expect(fakeQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('company.categories', 'c', 'c.id = :categoryId', { categoryId: 1 });
    expect(fakeQueryBuilder.where).toHaveBeenCalledWith('user.userType = :type', { type: UserType.EXTERNAL_MAINTAINER });
    expect(result).toEqual([maintainer1, maintainer2]);
  });

  it("should return empty array when no maintainers exist for category", async () => {
    const { CategoryDAO } = require("@daos/CategoryDAO");
    const category = new CategoryDAO();
    category.id = 2;
    category.name = "Public Lighting";

    const fakeQueryBuilder = createFakeQueryBuilder([]);
    const fakeRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(fakeQueryBuilder),
    };

    const database = require("@database");
    jest.spyOn(database.AppDataSource, "getRepository").mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    const result = await repo.findMaintainersByCategory(category);

    expect(fakeRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(result).toEqual([]);
  });

  it("should return empty array when category is null or has no id", async () => {
    const { CategoryDAO } = require("@daos/CategoryDAO");
    const fakeRepo: any = {
      createQueryBuilder: jest.fn(),
    };

    const database = require("@database");
    jest.spyOn(database.AppDataSource, "getRepository").mockImplementation(() => fakeRepo);

    const repo = new UserRepository();
    
    // Test with null category
    const resultNull = await repo.findMaintainersByCategory(null as any);
    expect(resultNull).toEqual([]);
    
    // Test with category without id
    const category = new CategoryDAO();
    category.name = "No ID Category";
    const resultNoId = await repo.findMaintainersByCategory(category);
    expect(resultNoId).toEqual([]);
    
    expect(fakeRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
