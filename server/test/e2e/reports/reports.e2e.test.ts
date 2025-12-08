import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { AppDataSource } from "@database";
import { OfficeDAO } from "@daos/OfficeDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { UserDAO, UserType } from "@daos/UserDAO";
import { ChatDAO } from "@daos/ChatsDAO";
import * as bcrypt from "bcryptjs";

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
		const body = { payload: { ...(getValidPayload().payload as any), ...(patch.payload) } };
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
				lat: 40,
				long: 8,
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

	describe("Chat creation on report assignment", () => {
		it("should create chat between citizen and TOSM when report is accepted and assigned", async () => {
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const chatRepo = AppDataSource.getRepository(ChatDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);

			const office = await AppDataSource.getRepository(OfficeDAO).findOne({ where: {} });

			const salt = await bcrypt.genSalt(10);
			
			// Create PRO user to assign reports
			const proHash = await bcrypt.hash("propass", salt);
			const proUser = userRepo.create({
				username: "pro_e2e_chat",
				email: "pro_e2e@test.com",
				passwordHash: proHash,
				firstName: "PRO",
				lastName: "E2E",
				userType: UserType.PUBLIC_RELATIONS_OFFICER,
			});
			await userRepo.save(proUser);
			
			const techHash = await bcrypt.hash("techpass", salt);
			const techUser = userRepo.create({
				username: "tech_e2e_chat",
				email: "tech_e2e@test.com",
				passwordHash: techHash,
				firstName: "Tech",
				lastName: "E2E",
				userType: UserType.TECHNICAL_STAFF_MEMBER,
				office: office!,
			});
			await userRepo.save(techUser);

			const citizenUser = await userRepo.findOne({ where: { userType: UserType.CITIZEN } });

			// Create pending report
			const payload = {
				payload: {
					title: "E2E Chat Test Report",
					description: "Testing chat creation in e2e",
					categoryId: categoryId,
					images: ["http://example.com/e2e.jpg"],
					lat: 45.07,
					long: 7.65,
					anonymous: false,
				},
			};

			await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(payload);

			const report = await reportRepo.findOne({
				where: { title: "E2E Chat Test Report" },
				relations: ["category", "createdBy"],
			});

			expect(report).toBeDefined();

			// Login as PRO user and accept/assign report
			const proLogin = await request(app).post("/api/users/login").send({
				username: "pro_e2e_chat",
				password: "propass",
			});
			const proToken = proLogin.body.token;

			const assignRes = await request(app)
				.put(`/api/reports/${report!.id}/status/public`)
				.set("Authorization", `Bearer ${proToken}`)
				.send({ status: ReportStatus.Assigned });

			expect(assignRes.status).toBe(200);

			// Verify chat was created
			const chats = await chatRepo.find({
				where: { report: { id: report!.id } },
				relations: ["tosm_user", "second_user", "report"],
			});

			expect(chats.length).toBeGreaterThan(0);
			expect(chats[0].tosm_user.userType).toBe(UserType.TECHNICAL_STAFF_MEMBER);
			expect(chats[0].second_user.id).toBe(citizenUser!.id);
		});

		it("should create second chat when external maintainer is assigned", async () => {
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const chatRepo = AppDataSource.getRepository(ChatDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);
			const categoryRepo = AppDataSource.getRepository(CategoryDAO);

			const category = await categoryRepo.findOne({ where: { id: categoryId } });
			const office = await AppDataSource.getRepository(OfficeDAO).findOne({ where: {} });

			const salt = await bcrypt.genSalt(10);
			const techHash = await bcrypt.hash("techpass2", salt);
			const techUser = userRepo.create({
				username: "tech_e2e_ext",
				email: "tech_e2e_ext@test.com",
				passwordHash: techHash,
				firstName: "Tech",
				lastName: "ExtTest",
				userType: UserType.TECHNICAL_STAFF_MEMBER,
				office: office!,
			});
			await userRepo.save(techUser);

			const extHash = await bcrypt.genSalt(10);
			const extUser = userRepo.create({
				username: "ext_e2e",
				email: "ext_e2e@test.com",
				passwordHash: await bcrypt.hash("extpass", extHash),
				firstName: "External",
				lastName: "E2E",
				userType: UserType.EXTERNAL_MAINTAINER,
			});
			await userRepo.save(extUser);

			const citizenUser = await userRepo.findOne({ where: { userType: UserType.CITIZEN } });

			// Create assigned report
			const report = reportRepo.create({
				title: "E2E External Maintainer Test",
				description: "Testing external maintainer chat",
				category: category!,
				images: ["https://img/e2e_ext.jpg"],
				lat: 45.07,
				long: 7.65,
				anonymous: false,
				createdBy: citizenUser!,
				status: ReportStatus.Assigned,
				assignedTo: techUser,
			});
			await reportRepo.save(report);

			// Create initial citizen-TOSM chat
			const initialChat = chatRepo.create({
				tosm_user: techUser,
				second_user: citizenUser!,
				report: report,
				chatType: "CITIZEN_TOSM" as any,
			});
			await chatRepo.save(initialChat);

			// Login as tech and assign external maintainer
			const techLogin = await request(app).post("/api/users/login").send({
				username: "tech_e2e_ext",
				password: "techpass2",
			});
			const techToken = techLogin.body.token;

			const assignExtRes = await request(app)
				.put(`/api/reports/${report.id}/assign-external`)
				.set("Authorization", `Bearer ${techToken}`)
				.send({ maintainerId: extUser.id });

			expect(assignExtRes.status).toBe(201);
			expect(assignExtRes.body.coAssignedTo).toBeDefined();

			// Verify two chats exist
			const chats = await chatRepo.find({
				where: { report: { id: report.id } },
				relations: ["tosm_user", "second_user"],
			});

			expect(chats.length).toBe(2);
			const extChat = chats.find((c) => c.second_user.id === extUser.id);
			expect(extChat).toBeDefined();
			expect(extChat?.tosm_user.id).toBe(techUser.id);
		});

		it("should not create duplicate chat on re-assignment", async () => {
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const chatRepo = AppDataSource.getRepository(ChatDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);

			const office = await AppDataSource.getRepository(OfficeDAO).findOne({ where: {} });

			const salt = await bcrypt.genSalt(10);
			
			// Create PRO user to assign reports
			const proHash = await bcrypt.hash("propass3", salt);
			const proUser = userRepo.create({
				username: "pro_e2e_dup",
				email: "pro_dup@test.com",
				passwordHash: proHash,
				firstName: "PRO",
				lastName: "Dup",
				userType: UserType.PUBLIC_RELATIONS_OFFICER,
			});
			await userRepo.save(proUser);
			
			const techHash = await bcrypt.hash("techpass3", salt);
			const techUser = userRepo.create({
				username: "tech_e2e_dup",
				email: "tech_dup@test.com",
				passwordHash: techHash,
				firstName: "Tech",
				lastName: "Dup",
				userType: UserType.TECHNICAL_STAFF_MEMBER,
				office: office!,
			});
			await userRepo.save(techUser);

			const payload = {
				payload: {
					title: "E2E No Duplicate Chat",
					description: "Testing no duplicate chat",
					categoryId: categoryId,
					images: ["http://example.com/nodup.jpg"],
					lat: 45.07,
					long: 7.65,
					anonymous: false,
				},
			};

			await request(app).post("/api/reports").set("Authorization", `Bearer ${token}`).send(payload);

			const report = await reportRepo.findOne({
				where: { title: "E2E No Duplicate Chat" },
				relations: ["category", "createdBy"],
			});

			const proLogin = await request(app).post("/api/users/login").send({
				username: "pro_e2e_dup",
				password: "propass3",
			});
			const proToken = proLogin.body.token;

			// First assignment
			await request(app)
				.put(`/api/reports/${report!.id}/status/public`)
				.set("Authorization", `Bearer ${proToken}`)
				.send({ status: ReportStatus.Assigned });

			const chatsAfterFirst = await chatRepo.find({
				where: { report: { id: report!.id } },
			});
			expect(chatsAfterFirst.length).toBe(1);

			// Second assignment
			await request(app)
				.put(`/api/reports/${report!.id}/status/public`)
				.set("Authorization", `Bearer ${proToken}`)
				.send({ status: ReportStatus.Assigned });

			const chatsAfterSecond = await chatRepo.find({
				where: { report: { id: report!.id } },
			});
			expect(chatsAfterSecond.length).toBe(1);
		});
	});
});

