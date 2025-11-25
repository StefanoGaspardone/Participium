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
 * E2E tests for the "Managing Pending Reports" feature
 * Tests the endpoints that allow PRO to view, accept, reject, and update category
 * of pending reports
 */
describe("Manage Pending Reports E2E Tests", () => {
  let proToken: string;
  let adminToken: string;
  let citizenToken: string;
  let categoryId: number;
  let alternativeCategoryId: number;
  let officeId: number;

  beforeAll(async () => {
    await f.default.beforeAll();

    const roleRepo = AppDataSource.getRepository(OfficeDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);

    // Get seeded office and categories
    const office = await roleRepo.findOneBy({});
    const categories = await categoryRepo.find({ relations: ["office"], take: 2 });
    categoryId = categories[0]!.id;
    alternativeCategoryId = categories[1]!.id;
    officeId = office!.id;

    // Create PRO user
    const salt = await bcrypt.genSalt(10);
    const proHash = await bcrypt.hash("pro", salt);
    const proUser = userRepo.create({
      username: "pro_manage_test",
      email: "pro_manage@test.com",
      passwordHash: proHash,
      firstName: "Pro",
      lastName: "Manager",
      userType: UserType.PUBLIC_RELATIONS_OFFICER,
    });
    await userRepo.save(proUser);

    // Create Admin user
    const adminHash = await bcrypt.hash("admin", salt);
    const adminUser = userRepo.create({
      username: "admin_manage_test",
      email: "admin_manage@test.com",
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "Manager",
      userType: UserType.MUNICIPAL_ADMINISTRATOR,
    });
    await userRepo.save(adminUser);

    // Login as different users
    const proLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "pro_manage_test", password: "pro" });
    proToken = proLogin.body.token;

    const adminLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "admin_manage_test", password: "admin" });
    adminToken = adminLogin.body.token;

    const citizenLogin = await request(app)
      .post("/api/users/login")
      .send({ username: "user", password: "user" });
    citizenToken = citizenLogin.body.token;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  describe("GET /api/reports?status=PendingApproval", () => {
    it("should return 400 if status query param is missing", async () => {
      const res = await request(app).get("/api/reports");
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("status");
    });

    it("should return 400 if status query param is invalid", async () => {
      const res = await request(app).get("/api/reports?status=INVALID_STATUS");
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("status");
    });

    it("should return empty array when no pending reports exist", async () => {
      const res = await request(app).get("/api/reports?status=PendingApproval");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("reports");
      expect(Array.isArray(res.body.reports)).toBe(true);
    });

    it("should return list of pending reports", async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const category = await categoryRepo.findOneBy({ id: categoryId });

      const report = reportRepo.create({
        title: "Pending Report Test",
        description: "This is pending approval",
        status: ReportStatus.PendingApproval,
        createdBy: creator!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      await reportRepo.save(report);

      const res = await request(app).get("/api/reports?status=PendingApproval");
      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBeGreaterThan(0);
      expect(res.body.reports[0]).toHaveProperty("status", ReportStatus.PendingApproval);
    });

    it("should include category and createdBy in pending reports", async () => {
      const res = await request(app).get("/api/reports?status=PendingApproval");
      expect(res.status).toBe(200);
      if (res.body.reports.length > 0) {
        const report = res.body.reports[0];
        expect(report).toHaveProperty("category");
        expect(report.category).toHaveProperty("name");
        expect(report).toHaveProperty("createdBy");
      }
    });
  });

  describe("PUT /api/reports/:id/status/public", () => {
    let reportId: number;

    beforeEach(async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const category = await categoryRepo.findOneBy({ id: categoryId });
      const report = reportRepo.create({
        title: "Report for Category Update E2E",
        description: "Testing category update",
        status: ReportStatus.PendingApproval,
        createdBy: creator!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      const saved = await reportRepo.save(report);
      reportId = saved.id;
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/category`)
        .send({ categoryId });
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is Citizen", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/category`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ categoryId });
      expect(res.status).toBe(403);
    });

    it("should return 400 if categoryId is invalid", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/category`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ categoryId: -1 });
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("categoryId");
    });

    it("should return 404 if report not found", async () => {
      const res = await request(app)
        .put("/api/reports/999999/category")
        .set("Authorization", `Bearer ${proToken}`)
        .send({ categoryId });
      expect(res.status).toBe(404);
    });

    it("should return 200 if PRO updates category", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/category`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ categoryId: alternativeCategoryId });

      expect(res.status).toBe(200);
      expect(res.body.report).toHaveProperty("category");
      expect(res.body.report.category.id).toBe(alternativeCategoryId);
    });

    it("should return 200 if Admin updates category", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/category`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryId: alternativeCategoryId });

      expect(res.status).toBe(200);
      expect(res.body.report.category.id).toBe(alternativeCategoryId);
    });
  });

  describe("PUT /api/reports/:id/status/public", () => {
    let reportId: number;

    beforeEach(async () => {
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);

      const creator = await userRepo.findOneBy({ username: "user" });
      const category = await categoryRepo.findOneBy({ id: categoryId });

      const report = reportRepo.create({
        title: "Report for Status Update E2E",
        description: "Testing status change",
        status: ReportStatus.PendingApproval,
        createdBy: creator!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      const saved = await reportRepo.save(report);
      reportId = saved.id;
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .send({ status: ReportStatus.Assigned });
      expect(res.status).toBe(401);
    });

    it("should return 403 if Admin tries (only PRO allowed)", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: ReportStatus.Assigned });
      expect(res.status).toBe(403);
    });

    it("should return 403 if Citizen tries", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ status: ReportStatus.Assigned });
      expect(res.status).toBe(403);
    });

    it("should return 400 if status is invalid", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: "INVALID" });
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("status");
    });

    it("should return 400 if status is missing", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("status");
    });

    it("should return 400 if status is Rejected but no description", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: ReportStatus.Rejected });
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("rejectedDescription");
    });

    it("should return 404 if report not found", async () => {
      const res = await request(app)
        .put("/api/reports/999999/status/public")
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: ReportStatus.Rejected, rejectedDescription: "Not found" });
      expect(res.status).toBe(404);
    });

    it("should return 400 if PRO assigns report but no technical staff exists for the office", async () => {
      // Ensure no technical staff exists for this test
      const userRepo = AppDataSource.getRepository(UserDAO);
      await userRepo.delete({ userType: UserType.TECHNICAL_STAFF_MEMBER });

      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: ReportStatus.Assigned });

      expect(res.status).toBe(400);
    });

    it("should return 200 if PRO assigns report and technical staff exists", async () => {
      const userRepo = AppDataSource.getRepository(UserDAO);
      const roleRepo = AppDataSource.getRepository(OfficeDAO);
      const office = await roleRepo.findOneBy({ id: officeId });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("tech", salt);
      const techUser = userRepo.create({
        username: "tech_for_assign",
        email: "tech_assign@test.com",
        passwordHash: hash,
        firstName: "Tech",
        lastName: "Assign",
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: office!,
      });
      await userRepo.save(techUser);

      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: ReportStatus.Assigned });

      expect(res.status).toBe(200);
      expect(res.body.report).toHaveProperty("status", ReportStatus.Assigned);
      expect(res.body.report).toHaveProperty("assignedTo");
      expect(res.body.report.assignedTo).toBeDefined();
    });

    it("should return 200 if PRO rejects report with description", async () => {
      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({
          status: ReportStatus.Rejected,
          rejectedDescription: "Not a valid report",
        });

      expect(res.status).toBe(200);
      expect(res.body.report).toHaveProperty("status", ReportStatus.Rejected);
      expect(res.body.report).toHaveProperty("rejectedDescription", "Not a valid report");
    });

    it("should create notification when report is assigned", async () => {
      const userRepo = AppDataSource.getRepository(UserDAO);
      const roleRepo = AppDataSource.getRepository(OfficeDAO);
      const office = await roleRepo.findOneBy({ id: officeId });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("tech", salt);
      const techUser = userRepo.create({
        username: "tech_for_notification",
        email: "tech_notif@test.com",
        passwordHash: hash,
        firstName: "Tech",
        lastName: "Notif",
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: office!,
      });
      const savedTech = await userRepo.save(techUser);

      const res = await request(app)
        .put(`/api/reports/${reportId}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: ReportStatus.Assigned });

      expect(res.status).toBe(200);

      // Check that notification was created for the report
      const { NotificationDAO } = await import("@daos/NotificationsDAO");
      const notifRepo = AppDataSource.getRepository(NotificationDAO);
      const notifications = await notifRepo.find({
        where: { report: { id: reportId } },
        relations: ["user", "report"],
      });

      expect(notifications.length).toBeGreaterThan(0);
      // Notification should be for one of the users involved (creator or assigned tech)
      expect(notifications.some((n) => n.newStatus === ReportStatus.Assigned)).toBe(true);
    });

    it("should assign reports to technical staff members in round-robin fashion", async () => {
      const userRepo = AppDataSource.getRepository(UserDAO);
      const roleRepo = AppDataSource.getRepository(OfficeDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const reportRepo = AppDataSource.getRepository(ReportDAO);

      const office = await roleRepo.findOneBy({ id: officeId });
      const category = await categoryRepo.findOneBy({ id: categoryId });
      const creator = await userRepo.findOneBy({ username: "user" });

      // Create two technical staff members
      const salt = await bcrypt.genSalt(10);
      const hash1 = await bcrypt.hash("tech1", salt);
      const tech1 = userRepo.create({
        username: "tech_roundrobin_1",
        email: "tech1_rr@test.com",
        passwordHash: hash1,
        firstName: "Tech",
        lastName: "One",
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: office!,
      });
      await userRepo.save(tech1);

      const hash2 = await bcrypt.hash("tech2", salt);
      const tech2 = userRepo.create({
        username: "tech_roundrobin_2",
        email: "tech2_rr@test.com",
        passwordHash: hash2,
        firstName: "Tech",
        lastName: "Two",
        userType: UserType.TECHNICAL_STAFF_MEMBER,
        office: office!,
      });
      await userRepo.save(tech2);

      // Create two reports
      const report1 = reportRepo.create({
        title: "RR Report 1",
        description: "First report for round robin",
        status: ReportStatus.PendingApproval,
        createdBy: creator!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      const saved1 = await reportRepo.save(report1);

      const report2 = reportRepo.create({
        title: "RR Report 2",
        description: "Second report for round robin",
        status: ReportStatus.PendingApproval,
        createdBy: creator!,
        category: category!,
        images: ["http://example.com/1.jpg"],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
      });
      const saved2 = await reportRepo.save(report2);

      // Assign both reports
      await request(app)
        .put(`/api/reports/${saved1.id}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: ReportStatus.Assigned });

      await request(app)
        .put(`/api/reports/${saved2.id}/status/public`)
        .set("Authorization", `Bearer ${proToken}`)
        .send({ status: ReportStatus.Assigned });

      // Verify they were assigned to different staff members
      const updated1 = await reportRepo.findOne({
        where: { id: saved1.id },
        relations: ["assignedTo"],
      });
      const updated2 = await reportRepo.findOne({
        where: { id: saved2.id },
        relations: ["assignedTo"],
      });

      expect(updated1!.assignedTo).toBeDefined();
      expect(updated2!.assignedTo).toBeDefined();
      // They should be assigned to different people (round-robin)
      expect(updated1!.assignedTo!.id).not.toBe(updated2!.assignedTo!.id);
    });
  });
});
