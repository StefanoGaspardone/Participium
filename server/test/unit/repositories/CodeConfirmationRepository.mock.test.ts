import { CodeConfirmationDAO } from '@daos/CodeConfirmationDAO';
import { UserDAO } from '@daos/UserDAO';

describe('CodeConfirmationRepository (mock)', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	describe('save', () => {
		it('should call underlying repo.save and return the saved DAO', async () => {
			const user = new UserDAO();
			user.id = 1;
			user.username = 'testuser';

			const codeConfirmation = new CodeConfirmationDAO();
			codeConfirmation.id = 1;
			codeConfirmation.code = '123456';
			codeConfirmation.expirationDate = new Date('2025-12-31');
			codeConfirmation.user = user;

			const fakeRepo: any = {
				save: jest.fn().mockResolvedValue(codeConfirmation),
				findOne: jest.fn(),
				delete: jest.fn(),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			const res = await repo.save(codeConfirmation);

			expect(fakeRepo.save).toHaveBeenCalledWith(codeConfirmation);
			expect(res).toEqual(codeConfirmation);
		});

		it('should save a new code confirmation without id', async () => {
			const user = new UserDAO();
			user.id = 2;
			user.username = 'newuser';

			const newCodeConfirmation = new CodeConfirmationDAO();
			newCodeConfirmation.code = '654321';
			newCodeConfirmation.expirationDate = new Date('2025-12-31');
			newCodeConfirmation.user = user;

			const savedCodeConfirmation = { ...newCodeConfirmation, id: 5 };

			const fakeRepo: any = {
				save: jest.fn().mockResolvedValue(savedCodeConfirmation),
				findOne: jest.fn(),
				delete: jest.fn(),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			const res = await repo.save(newCodeConfirmation);

			expect(fakeRepo.save).toHaveBeenCalledWith(newCodeConfirmation);
			expect(res.id).toBe(5);
			expect(res.code).toBe('654321');
		});
	});

	describe('findByUserId', () => {
		it('should call underlying repo.findOne with correct parameters and return the DAO', async () => {
			const user = new UserDAO();
			user.id = 1;
			user.username = 'testuser';

			const codeConfirmation = new CodeConfirmationDAO();
			codeConfirmation.id = 1;
			codeConfirmation.code = '123456';
			codeConfirmation.expirationDate = new Date('2025-12-31');
			codeConfirmation.user = user;

			const fakeRepo: any = {
				save: jest.fn(),
				findOne: jest.fn().mockResolvedValue(codeConfirmation),
				delete: jest.fn(),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			const res = await repo.findByUserId(1);

			expect(fakeRepo.findOne).toHaveBeenCalledWith({
				where: { user: { id: 1 } },
				relations: ['user']
			});
			expect(res).toEqual(codeConfirmation);
		});

		it('should return null when code confirmation not found for user', async () => {
			const fakeRepo: any = {
				save: jest.fn(),
				findOne: jest.fn().mockResolvedValue(null),
				delete: jest.fn(),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			const res = await repo.findByUserId(999);

			expect(fakeRepo.findOne).toHaveBeenCalledWith({
				where: { user: { id: 999 } },
				relations: ['user']
			});
			expect(res).toBeNull();
		});

		it('should load user relation correctly', async () => {
			const user = new UserDAO();
			user.id = 3;
			user.username = 'usertest';
			user.email = 'user@test.com';

			const codeConfirmation = new CodeConfirmationDAO();
			codeConfirmation.id = 10;
			codeConfirmation.code = '999888';
			codeConfirmation.expirationDate = new Date('2025-12-31');
			codeConfirmation.user = user;

			const fakeRepo: any = {
				save: jest.fn(),
				findOne: jest.fn().mockResolvedValue(codeConfirmation),
				delete: jest.fn(),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			const res = await repo.findByUserId(3);

			expect(res).toBeDefined();
			expect(res?.user).toBeDefined();
			expect(res?.user.id).toBe(3);
			expect(res?.user.username).toBe('usertest');
		});
	});

	describe('deleteById', () => {
		it('should call underlying repo.delete with the correct id', async () => {
			const fakeRepo: any = {
				save: jest.fn(),
				findOne: jest.fn(),
				delete: jest.fn().mockResolvedValue({ affected: 1 }),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			await repo.deleteById(1);

			expect(fakeRepo.delete).toHaveBeenCalledWith(1);
		});

		it('should handle deletion of non-existent code confirmation', async () => {
			const fakeRepo: any = {
				save: jest.fn(),
				findOne: jest.fn(),
				delete: jest.fn().mockResolvedValue({ affected: 0 }),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			await repo.deleteById(999);

			expect(fakeRepo.delete).toHaveBeenCalledWith(999);
		});

		it('should delete code confirmation with specific id', async () => {
			const fakeRepo: any = {
				save: jest.fn(),
				findOne: jest.fn(),
				delete: jest.fn().mockResolvedValue({ affected: 1 }),
			};

			const database = require('@database');
			jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

			const { CodeConfirmationRepository } = require('@repositories/CodeConfirmationRepository');
			const repo = new CodeConfirmationRepository();
			await repo.deleteById(42);

			expect(fakeRepo.delete).toHaveBeenCalledWith(42);
			expect(fakeRepo.delete).toHaveBeenCalledTimes(1);
		});
	});
});

