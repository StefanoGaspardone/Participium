import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { UserDAO } from "@daos/UserDAO";

const ADMIN_PASSWORD = 'admin'; //NOSONAR
const TECHSTAFF_PASSWORD = 'techstaff'; //NOSONAR
const CITIZEN_PASSWORD = 'citizenpass'; //NOSONAR

// E2E tests may take longer than Jest's default timeout
jest.setTimeout(30000);

describe("Users e2e tests: TSM Multiple Offices", () => {
  let adminToken: string;
  let tsmToken: string;
  let tsmUserId: number;
  let office1Id: number;
  let office2Id: number;
  let office3Id: number;

  beforeAll(async () => {
    await f.default.beforeAll();

    // Login as admin (already exists from test-datasource.ts)
    const adminLoginRes = await request(app)
      .post("/api/users/login")
      .send({ username: "admin", password: ADMIN_PASSWORD });
    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.token;

    // Get existing offices (populated by test-datasource.ts)
    const officesRes = await request(app).get("/api/offices");
    expect(officesRes.status).toBe(200);
    const offices = officesRes.body;
    expect(offices.length).toBeGreaterThanOrEqual(3);
    
    [office1Id, office2Id, office3Id] = [offices[0].id, offices[1].id, offices[2].id];

    // Get the techstaff user ID from database (user exists from test-datasource.ts)
    const { AppDataSource } = await import("@database");
    const userRepo = AppDataSource.getRepository(UserDAO);
    const tsmUser = await userRepo.findOne({ where: { username: "techstaff" } });
    expect(tsmUser).toBeDefined();
    tsmUserId = tsmUser!.id;

    // Login as existing techstaff user to get token
    const tsmLoginRes = await request(app)
      .post("/api/users/login")
      .send({ username: "techstaff", password: TECHSTAFF_PASSWORD });
    expect(tsmLoginRes.status).toBe(200);
    tsmToken = tsmLoginRes.body.token;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  describe("GET /api/users/tsm - Get all TSM members", () => {
    it("should return all TSM members with their offices (admin token)", async () => {
      const res = await request(app)
        .get("/api/users/tsm")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tsm)).toBe(true);
      expect(res.body.tsm.length).toBeGreaterThan(0);

      // Check that at least one TSM has offices
      const tsmWithOffices = res.body.tsm.find((tsm: any) => tsm.offices?.length > 0);
      expect(tsmWithOffices).toBeDefined();
      expect(Array.isArray(tsmWithOffices.offices)).toBe(true);
    });

    it("should return 401 without authentication token", async () => {
      const res = await request(app).get("/api/users/tsm");

      expect(res.status).toBe(401);
    });

    it("should return 403 when non-admin user tries to access", async () => {
      const res = await request(app)
        .get("/api/users/tsm")
        .set("Authorization", `Bearer ${tsmToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/users/tsm/:id - Update TSM offices", () => {
    it("should update TSM offices successfully (admin token)", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office1Id, office2Id] });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/availability updated/i);
      expect(res.body.updatedTsm.offices).toHaveLength(2);
    });

    it("should update TSM to single office", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office3Id] });

      expect(res.status).toBe(200);
      expect(res.body.updatedTsm.offices).toHaveLength(1);
    });

    it("should update TSM to multiple offices (3 offices)", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office1Id, office2Id, office3Id] });

      expect(res.status).toBe(200);
      expect(res.body.updatedTsm.offices).toHaveLength(3);
    });

    it("should return 401 without authentication token", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .send({ officeIds: [office1Id] });

      expect(res.status).toBe(401);
    });

    it("should return 403 when non-admin user tries to update", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${tsmToken}`)
        .send({ officeIds: [office1Id] });

      expect(res.status).toBe(403);
    });

    it("should return 400 when TSM ID is invalid", async () => {
      const res = await request(app)
        .patch("/api/users/tsm/invalid")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office1Id] });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid number/i);
    });

    it("should return 400 when officeIds is missing", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/officeIds/i);
    });

    it("should return 400 when officeIds is not an array", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: "not-an-array" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/array/i);
    });

    it("should return 400 when officeIds is an empty array", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not empty/i);
    });

    it("should return 404 when TSM user does not exist", async () => {
      const res = await request(app)
        .patch("/api/users/tsm/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office1Id] });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should return 400 when office does not exist", async () => {
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [999999] });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/office.*not found/i);
    });

    it("should return 400 when trying to update non-TSM user", async () => {
      // Create a regular citizen user for this specific test
      const citizenRes = await request(app)
        .post("/api/users/signup")
        .send({
          email: "e2e_citizen_test@example.com",
          password: CITIZEN_PASSWORD,
          firstName: "Citizen",
          lastName: "Test",
          username: "e2ecitizen",
          emailNotificationsEnabled: false,
        });
      expect(citizenRes.status).toBe(201);

      // Get the citizen's ID from database
      const { AppDataSource } = await import("@database");
      const userRepo = AppDataSource.getRepository(UserDAO);
      const citizen = await userRepo.findOne({ where: { username: "e2ecitizen" } });
      const citizenId = citizen!.id;

      // Try to update citizen's offices (should fail)
      const res = await request(app)
        .patch(`/api/users/tsm/${citizenId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office1Id] });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not a technical staff member/i);
    });
  });

  describe("Integration: TSM offices persistence and retrieval", () => {
    it("should persist office changes and retrieve them correctly", async () => {
      // Update TSM to have 2 specific offices
      const updateRes = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office1Id, office2Id] });
      expect(updateRes.status).toBe(200);

      // Retrieve all TSMs and verify the changes persisted
      const getTsmsRes = await request(app)
        .get("/api/users/tsm")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(getTsmsRes.status).toBe(200);

      const updatedTsm = getTsmsRes.body.tsm.find((tsm: any) => tsm.id === tsmUserId);
      expect(updatedTsm).toBeDefined();
      expect(updatedTsm.offices).toHaveLength(2);
    });

    it("should handle replacing offices correctly", async () => {
      // Start with 2 offices
      await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office1Id, office2Id] });

      // Replace with just office3
      const res = await request(app)
        .patch(`/api/users/tsm/${tsmUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ officeIds: [office3Id] });

      expect(res.status).toBe(200);
      expect(res.body.updatedTsm.offices).toHaveLength(1);

      // Verify persistence
      const getTsmsRes = await request(app)
        .get("/api/users/tsm")
        .set("Authorization", `Bearer ${adminToken}`);
      const verifiedTsm = getTsmsRes.body.tsm.find((tsm: any) => tsm.id === tsmUserId);
      expect(verifiedTsm.offices).toHaveLength(1);
    });
  });
});
