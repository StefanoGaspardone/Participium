import "reflect-metadata";
import "dotenv/config";
import * as bcrypt from "bcryptjs";

// Set environment variables for test DB, so that the .env ones are not used
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5445";
process.env.DB_USERNAME = "postgres";
process.env.DB_PASSWORD = "mysecretpassword";
process.env.DB_NAME = "test_postgres";

// Lazy imports so that the DB config picks up the env vars above
let AppDataSource: any;
let initializeDatabase: any;
let closeDatabase: any;

export async function initializeTestDatasource() {
  // import database module after env vars are set
  const db = await import("@database");
  AppDataSource = db.AppDataSource;
  initializeDatabase = db.initializeDatabase;
  closeDatabase = db.closeDatabase;

  await initializeDatabase();
  return AppDataSource;
}

export async function closeTestDataSource() {
  if (!closeDatabase) {
    const db = await import("@database");
    closeDatabase = db.closeDatabase;
  }
  await closeDatabase();
}

// Populate some predefined roles and users (reused from scripts/populate-db.ts)
import { OfficeDAO } from "@daos/OfficeDAO";
import { UserType, UserDAO } from "@daos/UserDAO";

const ROLES: string[] = [
  "Public Services Division",
  "Environmental Quality Division",
  "Green Areas, Parks and Animal Welfare Division",
  "Infrastructure Division",
  "General Services Division",
];

const USERS: Array<{
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
}> = [
  {
    username: "admin",
    email: "admin@gmail.com",
    firstName: "Admin",
    lastName: "Admin",
    password: "admin",
    userType: UserType.ADMINISTRATOR,
  },
  {
    username: "user",
    email: "user@gmail.com",
    firstName: "user",
    lastName: "user",
    password: "user",
    userType: UserType.CITIZEN,
  },
];

export async function populateTestData() {
  if (!AppDataSource) {
    // ensure DB is initialized
    await initializeTestDatasource();
  }

  const roleRepo = AppDataSource.getRepository(OfficeDAO);
  const userRepo = AppDataSource.getRepository(UserDAO);

  const roleMap = new Map<string, any>();
  for (const name of ROLES) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    let role = await roleRepo.findOne({ where: { name: trimmed } });
    if (!role) {
      role = roleRepo.create({ name: trimmed });
      role = await roleRepo.save(role);
    }
    roleMap.set(trimmed, role);
  }

  for (const u of USERS) {
    const trimmedUsername = u.username.trim();
    const trimmedEmail = u.email.trim();
    if (!trimmedUsername || !trimmedEmail) continue;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(u.password, salt);

    let user = await userRepo.findOne({ where: { username: trimmedUsername } });
    if (!user) {
      user = userRepo.create({
        username: trimmedUsername,
        email: trimmedEmail,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        userType: u.userType,
      });
      user = await userRepo.save(user);
    }
  }
}

export async function emptyTestData() {
  if (!AppDataSource) {
    // ensure DB is initialized
    await initializeTestDatasource();
  }
  await AppDataSource.query(
    'TRUNCATE TABLE "reports", "users", "categories", "office_roles" RESTART IDENTITY CASCADE;'
  );
}
