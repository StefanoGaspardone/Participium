import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { AppDataSource } from "@database";
// Tests should prefer using data seeded by the lifecycle (`populateTestData`).
// We'll pick the first existing category created by the lifecycle and use its
// office for assertions. The test will fail early if no category exists.
import { OfficeDAO } from "@daos/OfficeDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { ReportDAO } from "@daos/ReportDAO";
import { CONFIG } from "@config";

describe("Reports e2e tests", () => {
	let token: string;
	let categoryId: number | undefined;

	beforeAll(async () => {
		// initialize DB and populate common test users/roles
		await f.default.beforeAll();

		// repositories
		const roleRepo = AppDataSource.getRepository(OfficeDAO);
		const categoryRepo = AppDataSource.getRepository(CategoryDAO);

		// Use the first seeded office and category from the lifecycle
		const role = await roleRepo.findOneBy({});
		const categories = await categoryRepo.find({ relations: ['office'], take: 1 });
		const category = categories[0];
		categoryId = category?.id;

		// login as the seeded test user
		const login = await request(app)
			.post("/api/users/login")
			.send({ username: "user", password: "user" });
		expect(login.status).toBe(200);
		token = login.body.token as string;

		// sanity: lifecycle must have provided these fixtures
		expect(role).toBeDefined();
		expect(categoryId).toBeDefined();
	});

	afterAll(async () => {
		// teardown populated data and close DB
		await f.default.afterAll();
	});

	it("POST /api/reports => 401 without token", async () => {
		const body = { payload: {} };
		const res = await request(app).post("/api/reports").send(body);
		expect(res.status).toBe(401);
		expect(res.body).toHaveProperty("message");
	});

	const getValidPayload = () => ({
		payload: {
			title: "Valid title",
			description: "Valid description",
			categoryId: categoryId,
			images: ["http://example.com/1.jpg"],
			lat: 45.07,
			long: 7.65,
			anonymous: false,
		},
	});

	const invalidCases: Array<[string, any, string]> = [
		["title not string", { payload: { title: 123 } }, "title"],
		["images empty", { payload: { images: [] } }, "images"],
		["images > 3", { payload: { images: ["1", "2", "3", "4"] } }, "images"],
		["anonymous not boolean", { payload: { anonymous: "no" } }, "anonymous"],
		["categoryId invalid number", { payload: { categoryId: -1 } }, "categoryId"],
	];

	test.each(invalidCases)("POST /api/reports => 400 when %s", async (_name, patch, expectedField) => {
		const body = { payload: { ...(getValidPayload().payload as any), ...(patch.payload || {}) } };
		const res = await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(body);
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty("errors");
		expect(res.body.errors).toHaveProperty(expectedField);
	});

	it("POST /api/reports => 201 with valid payload and persisted in DB", async () => {
		const goodPayload = {
			payload: {
				...getValidPayload().payload,
				title: "Broken sidewalk E2E",
				description: "There is a large crack on the sidewalk near XY",
			},
		};

		const res = await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(goodPayload);
		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty("message");

		// verify persisted
		const repo = AppDataSource.getRepository(ReportDAO);
		const created = await repo.findOne({ where: { title: "Broken sidewalk E2E" }, relations: ["category", "createdBy"] });
		expect(created).toBeDefined();
		expect(created?.category?.id).toBe(categoryId);
	});

	it("POST /api/reports => 201 with 3 images (upper images boundary)", async () => {
		const payload = {
			payload: {
				title: "Many images E2E",
				description: "Testing three images allowed",
				categoryId: categoryId,
				images: ["http://example.com/1.jpg", "http://example.com/2.jpg", "http://example.com/3.jpg"],
				lat: 45.07,
				long: 7.65,
				anonymous: false,
			},
		};

		const res = await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(payload);
		expect(res.status).toBe(201);
	});

	it("POST /api/reports => 201 with valid Turin coordinates", async () => {
		const payload = {
			payload: {
				title: "Valid coords E2E",
				description: "Using valid Turin latitude and longitude",
				categoryId: categoryId,
				images: ["http://example.com/1.jpg"],
				lat: 45.0703,
				long: 7.6869,
				anonymous: false,
			},
		};

		const res = await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(payload);
		expect(res.status).toBe(201);
	});

	it("POST /api/reports => 400 when coordinates are outside Turin", async () => {
		const payload = {
			payload: {
				title: "Bad location E2E",
				description: "Coordinates outside Turin",
				categoryId: categoryId,
				images: ["http://example.com/1.jpg"],
				lat: 40.0,
				long: 8.0,
				anonymous: false,
			},
		};

		const res = await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(payload);
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty("errors");
		expect(res.body.errors).toHaveProperty("location");
	});

	it("POST /api/reports => 400 when coordinates are outside Turin (south)", async () => {
		const payload = {
			payload: {
				title: "Bad location south E2E",
				description: "Coordinates outside Turin boundaries",
				categoryId: categoryId,
				images: ["http://example.com/1.jpg"],
				lat: 44.5,
				long: 7.6869,
				anonymous: false,
			},
		};

		const res = await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(payload);
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty("errors");
		expect(res.body.errors).toHaveProperty("location");
	});

	it("POST /api/reports => 404 when categoryId does not exist", async () => {
		const payload = {
			payload: {
				title: "Unknown category E2E",
				description: "Category id does not exist",
				categoryId: 999999,
				images: ["http://example.com/1.jpg"],
				lat: 45.0703,
				long: 7.6869,
				anonymous: false,
			},
		};

		const res = await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(payload);
		expect(res.status).toBe(404);
		expect(res.body).toHaveProperty("message");
		expect(String(res.body.message).toLowerCase()).toMatch(/not found/);
	});
});

