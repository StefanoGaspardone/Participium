import * as f from "@test/e2e/lifecycle";
import { app } from "@app";
import request from "supertest";
import { AppDataSource } from "@database";
import { OfficeDAO } from "@daos/OfficeDAO";

describe("Offices e2e tests", () => {
	beforeAll(async () => {
		await f.default.beforeAll();
	});

	afterAll(async () => {
		await f.default.afterAll();
	});

	it("GET /api/offices => 200 and returns seeded offices", async () => {
		// read canonical offices from DB (seeded by lifecycle)
		const repo = AppDataSource.getRepository(OfficeDAO);
		const offices = await repo.find();
		expect(offices.length).toBeGreaterThan(0);

		const res = await request(app).get("/api/offices");
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);

		const namesFromDb = offices.map((o) => (o.name || "").toString().trim());
		const namesFromRes = (res.body as Array<any>).map((r) => (r.name || "").toString().trim());

		// ensure every seeded office appears in response
		for (const n of namesFromDb) {
			expect(namesFromRes).toContain(n);
		}
	});

		it("GET /api/offices => response DTO shape (id:number, name:string)", async () => {
			const res = await request(app).get("/api/offices");
			expect(res.status).toBe(200);
			expect(Array.isArray(res.body)).toBe(true);

			for (const item of res.body) {
				// id: numeric, integer, positive
				expect(item).toHaveProperty("id");
				expect(typeof item.id).toBe("number");
				expect(Number.isInteger(item.id)).toBe(true);
				expect(item.id).toBeGreaterThan(0);

				// name: non-empty string
				expect(item).toHaveProperty("name");
				expect(typeof item.name).toBe("string");
				expect(item.name.trim().length).toBeGreaterThan(0);
			}
		});
});
