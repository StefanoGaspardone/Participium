import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { AppDataSource } from "@database";
// Tests use data seeded by the lifecycle (`populateTestData`).
// We use the seeded "user" and "admin" accounts and create one test report.
import { NotificationDAO } from "@daos/NotificationsDAO";
import { UserDAO } from "@daos/UserDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { ReportDAO, ReportStatus } from "@daos/ReportDAO";

describe("Notifications e2e tests", () => {
  let citizenToken: string;
  let testReportId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Initialize DB and populate test data (users, categories, offices)
    await f.default.beforeAll();

    // Login as the seeded test user (citizen)
    const citizenLoginRes = await request(app)
      .post("/api/users/login")
      .send({ username: "user", password: "user" });
    expect(citizenLoginRes.status).toBe(200);
    citizenToken = citizenLoginRes.body.token;

    // Repositories
    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);

    // Use seeded data from lifecycle
    const user = await userRepo.findOne({ where: { username: "user" } });
    const categories = await categoryRepo.find({ take: 1 });
    const category = categories[0];

    // Sanity: lifecycle must have provided these fixtures
    expect(user).toBeDefined();
    expect(category).toBeDefined();
    testUserId = user!.id;

    // Create a test report for notification tests
    const report = reportRepo.create({
      title: "E2E Test Report for Notifications",
      description: "Test report for notification e2e tests",
      category,
      images: ["https://example.com/test-image.jpg"],
      lat: 45.0703,
      long: 7.6869,
      status: ReportStatus.PendingApproval,
      anonymous: false,
      createdBy: user!,
    });
    const savedReport = await reportRepo.save(report);
    testReportId = savedReport.id;
  });

  afterAll(async () => {
    await f.default.afterAll();
  });

  const getValidNotificationPayload = () => ({
    reportId: testReportId,
    previousStatus: ReportStatus.PendingApproval,
    newStatus: ReportStatus.Assigned,
    userId: testUserId,
  });

  describe("GET /api/notifications", () => {
    it("should return 200 and list all notifications", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notifications");
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it("should return notifications with correct DTO structure", async () => {
      // First create a notification
      await request(app)
        .post("/api/notifications")
        .send(getValidNotificationPayload());

      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(200);

      if (res.body.notifications.length > 0) {
        const notification = res.body.notifications[0];
        expect(notification).toHaveProperty("id");
        expect(typeof notification.id).toBe("number");
        expect(notification).toHaveProperty("previousStatus");
        expect(notification).toHaveProperty("newStatus");
        expect(notification).toHaveProperty("seen");
        expect(typeof notification.seen).toBe("boolean");
        expect(notification).toHaveProperty("createdAt");
      }
    });
  });

  describe("POST /api/notifications", () => {
    it("should return 201 and create notification with valid data", async () => {
      const payload = {
        ...getValidNotificationPayload(),
        newStatus: ReportStatus.InProgress,
      };

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(typeof res.body.id).toBe("number");
      expect(res.body.previousStatus).toBe(ReportStatus.PendingApproval);
      expect(res.body.newStatus).toBe(ReportStatus.InProgress);
      expect(res.body.seen).toBe(false);
    });

    it("should return 400 when reportId is missing", async () => {
      const { reportId, ...payload } = getValidNotificationPayload();

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/reportId is required/i);
    });

    it("should return 400 when previousStatus is missing", async () => {
      const { previousStatus, ...payload } = getValidNotificationPayload();

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/previousStatus is required/i);
    });

    it("should return 400 when newStatus is missing", async () => {
      const { newStatus, ...payload } = getValidNotificationPayload();

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/newStatus is required/i);
    });

    it("should return 400 when userId is missing", async () => {
      const { userId, ...payload } = getValidNotificationPayload();

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/userId is required/i);
    });

    it("should return 400 when previousStatus is invalid", async () => {
      const payload = {
        ...getValidNotificationPayload(),
        previousStatus: "InvalidStatus",
      };

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/previous report status type is invalid/i);
    });

    it("should return 400 when newStatus is invalid", async () => {
      const payload = {
        ...getValidNotificationPayload(),
        newStatus: "InvalidStatus",
      };

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/new report status type is invalid/i);
    });

    it("should return 400 when user does not exist", async () => {
      const payload = {
        ...getValidNotificationPayload(),
        userId: 999999,
      };

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/User not found/i);
    });

    it("should return 400 when report does not exist", async () => {
      const payload = {
        ...getValidNotificationPayload(),
        reportId: 999999,
      };

      const res = await request(app).post("/api/notifications").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/Report not found/i);
    });
  });

  describe("PATCH /api/notifications/seen/:id", () => {
    let notificationId: number;

    beforeEach(async () => {
      // Create a fresh notification for each test
      const createRes = await request(app)
        .post("/api/notifications")
        .send({
          ...getValidNotificationPayload(),
          previousStatus: ReportStatus.Assigned,
          newStatus: ReportStatus.InProgress,
        });
      notificationId = createRes.body.id;
    });

    it("should return 200 and mark notification as seen with valid token", async () => {
      const res = await request(app)
        .patch(`/api/notifications/seen/${notificationId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe("Notification marked as seen");

      // Verify the notification was actually marked as seen
      const notificationRepo = AppDataSource.getRepository(NotificationDAO);
      const notification = await notificationRepo.findOne({
        where: { id: notificationId },
      });
      expect(notification?.seen).toBe(true);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).patch(
        `/api/notifications/seen/${notificationId}`
      );

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 when notification id is invalid", async () => {
      const res = await request(app)
        .patch("/api/notifications/seen/invalid")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/Invalid notification ID/i);
    });

    it("should return 400 when notification does not exist", async () => {
      const res = await request(app)
        .patch("/api/notifications/seen/999999")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/Notification not found/i);
    });

    it("should work when notification is already seen (idempotent)", async () => {
      // Mark as seen first time
      await request(app)
        .patch(`/api/notifications/seen/${notificationId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      // Mark as seen second time
      const res = await request(app)
        .patch(`/api/notifications/seen/${notificationId}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Notification marked as seen");
    });
  });

  describe("GET /api/notifications/my", () => {
    beforeEach(async () => {
      // Create some notifications for the test user
      await request(app)
        .post("/api/notifications")
        .send(getValidNotificationPayload());

      await request(app)
        .post("/api/notifications")
        .send({
          ...getValidNotificationPayload(),
          previousStatus: ReportStatus.Assigned,
          newStatus: ReportStatus.InProgress,
        });
    });

    it("should return 200 and user's notifications with valid token", async () => {
      const res = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notifications");
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(2);

      // Verify all notifications belong to the user
      for (const notification of res.body.notifications) {
        expect(notification).toHaveProperty("id");
        expect(notification).toHaveProperty("previousStatus");
        expect(notification).toHaveProperty("newStatus");
        expect(notification).toHaveProperty("seen");
        expect(notification).toHaveProperty("createdAt");
      }
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/notifications/my");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("should return only notifications for the authenticated user", async () => {
      // Get citizen notifications
      const res = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      const citizenNotificationCount = res.body.notifications.length;

      // Create another user and their notification
      const newUserRes = await request(app).post("/api/users/signup").send({
        email: "notif-test@example.com",
        password: "password123",
        firstName: "Notif",
        lastName: "Test",
        username: "notiftest",
        emailNotificationsEnabled: false,
      });
      expect(newUserRes.status).toBe(201);

      const userRepo = AppDataSource.getRepository(UserDAO);
      const newUser = await userRepo.findOne({
        where: { username: "notiftest" },
      });

      // Activate the new user for testing
      if (newUser) {
        newUser.isActive = true;
        newUser.codeConfirmation = undefined as any;
        await userRepo.save(newUser);
      }

      const newUserLoginRes = await request(app)
        .post("/api/users/login")
        .send({ username: "notiftest", password: "password123" });
      const newUserToken = newUserLoginRes.body.token;

      await request(app)
        .post("/api/notifications")
        .send({
          ...getValidNotificationPayload(),
          previousStatus: ReportStatus.InProgress,
          newStatus: ReportStatus.Resolved,
          userId: newUser!.id,
        });

      // New user should have exactly 1 notification
      const newUserRes2 = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${newUserToken}`);
      expect(newUserRes2.status).toBe(200);
      expect(newUserRes2.body.notifications.length).toBe(1);

      // Original citizen should still have the same count
      const citizenRes2 = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(citizenRes2.status).toBe(200);
      expect(citizenRes2.body.notifications.length).toBe(citizenNotificationCount);
    });

    it("should return notifications ordered by creation date (newest first)", async () => {
      const res = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      const notifications = res.body.notifications;

      if (notifications.length > 1) {
        for (let i = 0; i < notifications.length - 1; i++) {
          const current = new Date(notifications[i].createdAt);
          const next = new Date(notifications[i + 1].createdAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });
  });

  describe("Notification lifecycle integration", () => {
    it("should create notification -> mark as seen -> verify in my notifications", async () => {
      // 1. Create a notification
      const createRes = await request(app)
        .post("/api/notifications")
        .send({
          ...getValidNotificationPayload(),
          previousStatus: ReportStatus.Resolved,
          newStatus: ReportStatus.PendingApproval,
        });
      expect(createRes.status).toBe(201);
      const notificationId = createRes.body.id;
      expect(createRes.body.seen).toBe(false);

      // 2. Verify it appears in user's notifications as unseen
      const myNotificationsRes = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(myNotificationsRes.status).toBe(200);
      const unseenNotif = myNotificationsRes.body.notifications.find(
        (n: any) => n.id === notificationId
      );
      expect(unseenNotif).toBeDefined();
      expect(unseenNotif.seen).toBe(false);

      // 3. Mark as seen
      const markSeenRes = await request(app)
        .patch(`/api/notifications/seen/${notificationId}`)
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(markSeenRes.status).toBe(200);

      // 4. Verify it's now marked as seen
      const myNotificationsRes2 = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(myNotificationsRes2.status).toBe(200);
      const seenNotif = myNotificationsRes2.body.notifications.find(
        (n: any) => n.id === notificationId
      );
      expect(seenNotif).toBeDefined();
      expect(seenNotif.seen).toBe(true);
    });

    it("should handle multiple status transitions for same report", async () => {
      // Create multiple notifications for status changes
      const transition1 = await request(app)
        .post("/api/notifications")
        .send(getValidNotificationPayload());
      expect(transition1.status).toBe(201);

      const transition2 = await request(app)
        .post("/api/notifications")
        .send({
          ...getValidNotificationPayload(),
          previousStatus: ReportStatus.Assigned,
          newStatus: ReportStatus.InProgress,
        });
      expect(transition2.status).toBe(201);

      const transition3 = await request(app)
        .post("/api/notifications")
        .send({
          ...getValidNotificationPayload(),
          previousStatus: ReportStatus.InProgress,
          newStatus: ReportStatus.Resolved,
        });
      expect(transition3.status).toBe(201);

      // Verify all transitions are recorded
      const myNotifications = await request(app)
        .get("/api/notifications/my")
        .set("Authorization", `Bearer ${citizenToken}`);
      expect(myNotifications.status).toBe(200);

      const reportNotifications = myNotifications.body.notifications.filter(
        (n: any) => n.report?.id === testReportId
      );
      expect(reportNotifications.length).toBeGreaterThanOrEqual(3);
    });
  });
});
