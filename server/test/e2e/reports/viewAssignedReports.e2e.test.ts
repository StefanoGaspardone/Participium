import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { AppDataSource } from "@database";
import { OfficeDAO } from "@daos/OfficeDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { UserDAO, UserType } from "@daos/UserDAO";
import * as bcrypt from "bcryptjs";

/**
 * E2E tests for the "Viewing Assigned Reports" feature
 * Tests the GET /api/reports/assigned endpoint that allows Technical Staff Members
 * to view reports assigned to them
 */
describe("View Assigned Reports E2E Tests", () => {
  let techToken: string;
  let techUserId: number;
  let citizenToken: string;
  let proToken: string;
  let categoryId: number;
  let officeId: number;

  beforeAll(async () => {
    await f.default.beforeAll();

    const roleRepo = AppDataSource.getRepository(OfficeDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);

    // Get seeded office and category
    const office = await roleRepo.findOneBy({});
    const categories = await categoryRepo.find({ relations: ["office"], take: 1 });
    const category = categories[0];
    categoryId = category!.id;
    officeId = office!.id;

    // Create Technical Staff Member
    const salt = await bcrypt.genSalt(10);
    const techHash = await bcrypt.hash("tech", salt);
    const techUser = userRepo.create({
      username: "tech_staff",
      email: "tech@test.com",
      passwordHash: techHash,
      firstName: "Tech",
      lastName: "Staff",
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      office: office!,
    });
    const savedTech = await userRepo.save(techUser);
    techUserId = savedTech.id;

    // Create PRO user
    const proHash = await bcrypt.hash("pro", salt);
    const proUser = userRepo.create({
      username: "pro_user",
      email: "pro@test.com",
      passwordHash: proHash,
      firstName: "Pro",
      lastName: "User",
      userType: UserType.PUBLIC_RELATIONS_OFFICER,
    });
    await userRepo.save(proUser);

    // Login as different users
    const techLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "tech_staff", password: "tech" });
    techToken = techLogin.body.token;

    const citizenLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "user", password: "user" });
    citizenToken = citizenLogin.body.token;

    const proLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "pro_user", password: "pro" });
    proToken = proLogin.body.token;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  describe("GET /api/reports/assigned", () => {
    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/api/reports/assigned");
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not a Technical Staff Member", async () => {
      const res = await request(app)
        .get("/api/reports/assigned")
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it("should return empty array when no reports are assigned to the TSM", async () => {
      const res = await request(app)
        .get("/api/reports/assigned")
        .set("Authorization", `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("reports");
      expect(Array.isArray(res.body.reports)).toBe(true);
      expect(res.body.reports.length).toBe(0);
    });

    it("should return reports assigned to the authenticated TSM", async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const techUser = await userRepo.findOneBy({ id: techUserId });
      const category = await categoryRepo.findOneBy({ id: categoryId });

      const report = reportRepo.create({
        title: "Assigned Report Test",
        description: "This is assigned to tech staff",
        status: ReportStatus.Assigned,
        createdBy: creator!,
        assignedTo: techUser!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      await reportRepo.save(report);

      const res = await request(app)
        .get("/api/reports/assigned")
        .set("Authorization", `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBeGreaterThan(0);
      expect(res.body.reports[0]).toHaveProperty("title", "Assigned Report Test");
      expect(res.body.reports[0]).toHaveProperty("status", ReportStatus.Assigned);
      expect(res.body.reports[0]).toHaveProperty("assignedTo");
      expect(res.body.reports[0].assignedTo.id).toBe(techUserId);
    });

    it("should only return reports assigned to the authenticated user, not other TSMs", async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const roleRepo = AppDataSource.getRepository(OfficeDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const techUser = await userRepo.findOneBy({ id: techUserId });
      const category = await categoryRepo.findOneBy({ id: categoryId });
      const office = await roleRepo.findOneBy({ id: officeId });

      // Create another tech user
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("tech2", salt);
      const techUser2 = userRepo.create({
        username: "tech_staff_2",
        email: "tech2@test.com",
        passwordHash: hash,
        firstName: "Tech",
        lastName: "Staff2",
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: office!,
      });
      const savedTech2 = await userRepo.save(techUser2);

      // Create report for first tech user
      const report1 = reportRepo.create({
        title: "Report for Tech 1",
        description: "Assigned to first tech",
        status: ReportStatus.Assigned,
        createdBy: creator!,
        assignedTo: techUser!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      await reportRepo.save(report1);

      // Create report for second tech user
      const report2 = reportRepo.create({
        title: "Report for Tech 2",
        description: "Assigned to second tech",
        status: ReportStatus.Assigned,
        createdBy: creator!,
        assignedTo: savedTech2,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      await reportRepo.save(report2);

      // First tech user should only see their report
      const res = await request(app)
        .get("/api/reports/assigned")
        .set("Authorization", `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBeGreaterThan(0);
      expect(res.body.reports.every((r: any) => r.assignedTo.id === techUserId)).toBe(true);
      expect(res.body.reports.find((r: any) => r.title === "Report for Tech 1")).toBeDefined();
      expect(res.body.reports.find((r: any) => r.title === "Report for Tech 2")).toBeUndefined();
    });

    it("should return reports ordered by createdAt DESC (newest first)", async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const techUser = await userRepo.findOneBy({ id: techUserId });
      const category = await categoryRepo.findOneBy({ id: categoryId });

      // Create older report
      const oldReport = reportRepo.create({
        title: "Old Report",
        description: "Created earlier",
        status: ReportStatus.Assigned,
        createdBy: creator!,
        assignedTo: techUser!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
        createdAt: new Date("2025-01-01"),
      });
      await reportRepo.save(oldReport);

      // Create newer report
      const newReport = reportRepo.create({
        title: "New Report",
        description: "Created later",
        status: ReportStatus.Assigned,
        createdBy: creator!,
        assignedTo: techUser!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
        createdAt: new Date("2025-01-02"),
      });
      await reportRepo.save(newReport);

      const res = await request(app)
        .get("/api/reports/assigned")
        .set("Authorization", `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      const reports = res.body.reports;
      const oldIndex = reports.findIndex((r: any) => r.title === "Old Report");
      const newIndex = reports.findIndex((r: any) => r.title === "New Report");

      // Newer report should come before older report
      expect(newIndex).toBeLessThan(oldIndex);
    });

    it("should include category and createdBy information in response", async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const techUser = await userRepo.findOneBy({ id: techUserId });
      const category = await categoryRepo.findOneBy({ id: categoryId });

      const report = reportRepo.create({
        title: "Report with Full Info",
        description: "Testing relations",
        status: ReportStatus.Assigned,
        createdBy: creator!,
        assignedTo: techUser!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      await reportRepo.save(report);

      const res = await request(app)
        .get("/api/reports/assigned")
        .set("Authorization", `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      const foundReport = res.body.reports.find((r: any) => r.title === "Report with Full Info");
      expect(foundReport).toBeDefined();
      expect(foundReport).toHaveProperty("category");
      expect(foundReport.category).toHaveProperty("name");
      expect(foundReport).toHaveProperty("createdBy");
      expect(foundReport.createdBy).toHaveProperty("username");
      expect(foundReport).toHaveProperty("assignedTo");
      expect(foundReport.assignedTo).toHaveProperty("username");
    });

    it("should return reports with different statuses (Assigned, InProgress)", async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const techUser = await userRepo.findOneBy({ id: techUserId });
      const category = await categoryRepo.findOneBy({ id: categoryId });

      // Create report with InProgress status
      const inProgressReport = reportRepo.create({
        title: "InProgress Report",
        description: "Currently being worked on",
        status: ReportStatus.InProgress,
        createdBy: creator!,
        assignedTo: techUser!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      await reportRepo.save(inProgressReport);

      const res = await request(app)
        .get("/api/reports/assigned")
        .set("Authorization", `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      const statuses = res.body.reports.map((r: any) => r.status);
      expect(statuses).toContain(ReportStatus.InProgress);
    });
  });
});
