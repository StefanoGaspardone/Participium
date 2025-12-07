import * as f from '@test/e2e/lifecycle';
import { app } from '@app';
import request from 'supertest';
import { AppDataSource } from '@database';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import * as bcrypt from 'bcryptjs';

describe('PUT /:id/assign-external - Assign External Maintainer E2E', () => {
	let tosmToken: string;
	let citizenToken: string;
	let categoryId: number | undefined;

	beforeAll(async () => {
		// Initialize DB and populate common test users/roles
		await f.default.beforeAll();

		// Get repositories
		const categoryRepo = AppDataSource.getRepository(CategoryDAO);
		const userRepo = AppDataSource.getRepository(UserDAO);

		// Get a category for creating reports
		const categories = await categoryRepo.find({ take: 1 });
		const category = categories[0];
		categoryId = category?.id;

		// Login as the seeded TOSM user from populate test data
		const tosmLogin = await request(app)
			.post('/api/users/login')
			.send({ username: 'techstaff', password: 'techstaff' });

		if (tosmLogin.status === 200) {
			tosmToken = tosmLogin.body.token as string;
		} else {
			// Fallback: login as default user and expect it's a TOSM
			const defaultLogin = await request(app)
				.post('/api/users/login')
				.send({ username: 'user', password: 'user' });
			tosmToken = defaultLogin.body.token as string;
		}

		// Get or create a citizen user for authorization tests
		const testPassword = 'TestPassword123!';
		const hashedPassword = await bcrypt.hash(testPassword, 10);

		let citizenUser = await userRepo.findOneBy({ username: 'citizen_assigned_test' });
		if (!citizenUser) {
			citizenUser = await userRepo.save({
				username: 'citizen_assigned_test',
				firstName: 'Citizen',
				lastName: 'User',
				userType: UserType.CITIZEN,
				email: 'citizen_assigned@test.it',
				passwordHash: hashedPassword,
				isActive: true
			});
		}

		// Login as citizen for authorization tests
		const citizenLogin = await request(app)
			.post('/api/users/login')
			.send({ username: citizenUser.username, password: testPassword });

		if (citizenLogin.status === 200) {
			citizenToken = citizenLogin.body.token as string;
		}

		// Sanity checks
		expect(categoryId).toBeDefined();
		expect(tosmToken).toBeDefined();
	});

	afterAll(async () => {
		// Teardown populated data and close DB
		await f.default.afterAll();
	});

	describe('Success Cases', () => {
		it('should assign external maintainer to report successfully', async () => {
			// Get repositories
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);

			// Get the TOSM user from populated data
			const tosmUser = await userRepo.findOneBy({ username: 'techstaff' });

			// Create an external maintainer
			const hashedPassword = await bcrypt.hash('maintainer_password', 10);
			const maintainer = await userRepo.save({
				username: 'ext_maintainer_1',
				firstName: 'External',
				lastName: 'Maintainer',
				userType: UserType.EXTERNAL_MAINTAINER,
				email: 'maintainer@test.it',
				passwordHash: hashedPassword,
				isActive: true
			});

			// Create a report
			const report = await reportRepo.save({
				title: 'Test Report for Assignment',
				description: 'Test Description',
				category: { id: categoryId! },
				createdBy: tosmUser!,
				status: ReportStatus.Assigned,
				assignedTo: tosmUser!,
				lat: 45.0703,
				long: 7.6869,
				images: ['image1.jpg']
			});

			const response = await request(app)
				.put(`/api/reports/${report.id}/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: maintainer.id })
				.expect(201);

			expect(response.body).toHaveProperty('id', report.id);
			expect(response.body).toHaveProperty('coAssignedTo');
		});

		it('should update report when assigned to different maintainer', async () => {
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);

			const tosmUser = await userRepo.findOneBy({ username: 'techstaff' });

			const hashedPassword = await bcrypt.hash('maintainer_password', 10);

			const maintainer1 = await userRepo.save({
				username: 'ext_maintainer_2',
				firstName: 'External',
				lastName: 'Maintainer1',
				userType: UserType.EXTERNAL_MAINTAINER,
				email: 'maintainer1@test.it',
				passwordHash: hashedPassword,
				isActive: true
			});

			const maintainer2 = await userRepo.save({
				username: 'ext_maintainer_3',
				firstName: 'External',
				lastName: 'Maintainer2',
				userType: UserType.EXTERNAL_MAINTAINER,
				email: 'maintainer2@test.it',
				passwordHash: hashedPassword,
				isActive: true
			});

			const report = await reportRepo.save({
				title: 'Test Report for Reassignment',
				description: 'Test Description',
				category: { id: categoryId! },
				createdBy: tosmUser!,
				status: ReportStatus.Assigned,
				assignedTo: tosmUser!,
				lat: 45.0703,
				long: 7.6869,
				images: ['image1.jpg']
			});

			// First assignment
			await request(app)
				.put(`/api/reports/${report.id}/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: maintainer1.id })
				.expect(201);

			// Second assignment (reassignment)
			const response = await request(app)
				.put(`/api/reports/${report.id}/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: maintainer2.id })
				.expect(201);

			expect(response.body.coAssignedTo?.id).toBe(maintainer2.id);
		});
	});

	describe('Validation Errors', () => {
		it('should return 400 if report id is invalid', async () => {
			const response = await request(app)
				.put(`/api/reports/invalid/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: 1 })
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/positive number/);
		});

		it('should return 400 if report id is not positive', async () => {
			const response = await request(app)
				.put(`/api/reports/-1/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: 1 })
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/positive number/);
		});

		it('should return 400 if maintainerId is missing', async () => {
			const response = await request(app)
				.put(`/api/reports/1/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({})
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/maintainerid.*missing/);
		});

		it('should return 400 if maintainerId is not a number', async () => {
			const response = await request(app)
				.put(`/api/reports/1/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: 'invalid' })
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/positive number/);
		});

		it('should return 400 if maintainerId is not positive', async () => {
			const response = await request(app)
				.put(`/api/reports/1/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: 0 })
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/positive number/);
		});
	});

	describe('Authorization Errors', () => {
		it('should return 401 if token is missing', async () => {
			const response = await request(app)
				.put(`/api/reports/1/assign-external`)
				.send({ maintainerId: 1 })
				.expect(401);

			expect(response.body).toHaveProperty('message');
		});

		it('should return 403 if user is not TECHNICAL_STAFF_MEMBER', async () => {
			if (citizenToken) {
				const response = await request(app)
					.put(`/api/reports/1/assign-external`)
					.set('Authorization', `Bearer ${citizenToken}`)
					.send({ maintainerId: 1 })
					.expect(403);

				expect(response.body).toHaveProperty('message');
			}
		});
	});

	describe('Business Logic Errors', () => {
		it('should return 404 if report does not exist', async () => {
			const response = await request(app)
				.put(`/api/reports/99999/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: 1 })
				.expect(404);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/not found/);
		});

		it('should return 404 if maintainer does not exist', async () => {
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);

			const tosmUser = await userRepo.findOneBy({ username: 'techstaff' });

			const report = await reportRepo.save({
				title: 'Test Report for Nonexistent Maintainer',
				description: 'Test Description',
				category: { id: categoryId! },
				createdBy: tosmUser!,
				status: ReportStatus.Assigned,
				assignedTo: tosmUser!,
				lat: 45.0703,
				long: 7.6869,
				images: ['image1.jpg']
			});

			const response = await request(app)
				.put(`/api/reports/${report.id}/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: 99999 })
				.expect(404);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/not found/);
		});

		it('should return 400 if TOSM is not assigned to the report', async () => {
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);

			// Get a different TOSM or create one
			const hashedPassword = await bcrypt.hash('tosm_password', 10);
			const otherTosm = await userRepo.save({
				username: 'other_tosm',
				firstName: 'Other',
				lastName: 'TOSM',
				userType: UserType.TECHNICAL_STAFF_MEMBER,
				email: 'other_tosm@test.it',
				passwordHash: hashedPassword,
				isActive: true
			});

			// Create an external maintainer
			const maintainer = await userRepo.save({
				username: 'ext_maintainer_4',
				firstName: 'External',
				lastName: 'Maintainer4',
				userType: UserType.EXTERNAL_MAINTAINER,
				email: 'maintainer4@test.it',
				passwordHash: hashedPassword,
				isActive: true
			});

			// Create a report assigned to the OTHER TOSM, not the one we're logged in as
			const report = await reportRepo.save({
				title: 'Test Report for Wrong TOSM',
				description: 'Test Description',
				category: { id: categoryId! },
				createdBy: otherTosm,
				status: ReportStatus.Assigned,
				assignedTo: otherTosm, // Assigned to different TOSM
				lat: 45.0703,
				long: 7.6869,
				images: ['image1.jpg']
			});

			const response = await request(app)
				.put(`/api/reports/${report.id}/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`) // Using different TOSM token
				.send({ maintainerId: maintainer.id })
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/not assigned/);
		});

		it('should return 400 if maintainer is not EXTERNAL_MAINTAINER type', async () => {
			const reportRepo = AppDataSource.getRepository(ReportDAO);
			const userRepo = AppDataSource.getRepository(UserDAO);

			const tosmUser = await userRepo.findOneBy({ username: 'techstaff' });

			// Create a regular citizen (not external maintainer)
			const hashedPassword = await bcrypt.hash('citizen_password', 10);
			const regularCitizen = await userRepo.save({
				username: 'regular_citizen',
				firstName: 'Regular',
				lastName: 'Citizen',
				userType: UserType.CITIZEN, // Not EXTERNAL_MAINTAINER
				email: 'regular@test.it',
				passwordHash: hashedPassword,
				isActive: true
			});

			const report = await reportRepo.save({
				title: 'Test Report for Wrong User Type',
				description: 'Test Description',
				category: { id: categoryId! },
				createdBy: tosmUser!,
				status: ReportStatus.Assigned,
				assignedTo: tosmUser!,
				lat: 45.0703,
				long: 7.6869,
				images: ['image1.jpg']
			});

			const response = await request(app)
				.put(`/api/reports/${report.id}/assign-external`)
				.set('Authorization', `Bearer ${tosmToken}`)
				.send({ maintainerId: regularCitizen.id })
				.expect(400);

			expect(response.body).toHaveProperty('message');
			expect(String(response.body.message).toLowerCase()).toMatch(/external maintainer/);
		});
	});
});
