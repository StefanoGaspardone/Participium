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
import { CategoryDAO } from "@daos/CategoryDAO";
import { UserType, UserDAO } from "@daos/UserDAO";

// Canonical offices and categories used for tests. Defining them here keeps
// the test datasource self-contained and avoids requiring the external
// populate script to be imported by tests. These mirror the project's
// `scripts/populate-db.ts` canonical lists and are safe to adjust for tests.
const OFFICES = [
  'Public Services Division',
  'Environmental Quality Division',
  'Green Areas, Parks and Animal Welfare Division',
  'Infrastructure Division',
  'General Services Division',
];

const CATEGORIES: Array<{ name: string; office: string }> = [
  { name: 'Water Supply - Drinking Water', office: 'Public Services Division' },
  { name: 'Architectural Barriers', office: 'Infrastructure Division' },
  { name: 'Sewer System', office: 'Public Services Division' },
  { name: 'Public Lighting', office: 'Infrastructure Division' },
  { name: 'Waste', office: 'Public Services Division' },
  { name: 'Road Signs and Traffic Lights', office: 'Infrastructure Division' },
  { name: 'Roads and Urban Furnishings', office: 'Infrastructure Division' },
  { name: 'Public Green Areas and Playgrounds', office: 'Green Areas, Parks and Animal Welfare Division' },
  { name: 'Other', office: 'General Services Division' },
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
  const categoryRepo = AppDataSource.getRepository(CategoryDAO);

  // ensure canonical offices exist (from scripts/populate-db.ts)
  const roleMap = new Map<string, any>();
  for (const name of OFFICES) {
    const trimmed = (name || '').toString().trim();
    if (!trimmed) continue;
    let role = await roleRepo.findOne({ where: { name: trimmed } });
    if (!role) {
      role = roleRepo.create({ name: trimmed });
      role = await roleRepo.save(role);
    }
    roleMap.set(trimmed, role);
  }

  // ensure canonical categories exist and are attached to the right office
  for (const item of CATEGORIES) {
    const name = (item.name || '').toString().trim();
    const officeName = (item.office || '').toString().trim();
    if (!name || !officeName) continue;

    const office = roleMap.get(officeName) || (await roleRepo.findOne({ where: { name: officeName } }));
    if (!office) {
      // skip categories whose office is missing; populate-db logs this scenario
      continue;
    }

    let cat = await categoryRepo.findOne({ where: { name } });
    if (!cat) {
      cat = categoryRepo.create({ name, office });
      await categoryRepo.save(cat);
    } else {
      // if category exists but office differs, update it
      if (!cat.office || cat.office.id !== office.id) {
        cat.office = office;
        await categoryRepo.save(cat);
      }
    }
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