import { CodeConfirmationDAO } from '@daos/CodeConfirmationDAO';
import { UserDAO } from '@daos/UserDAO';

describe('CodeConfirmationService (mock)', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	describe('create', () => {
		it('should create a new code confirmation without userId', async () => {
			const code = '123456';
			const expirationDate = new Date('2025-12-31');

			const savedCodeConfirmation = new CodeConfirmationDAO();
			savedCodeConfirmation.id = 1;
			savedCodeConfirmation.code = code;
			savedCodeConfirmation.expirationDate = expirationDate;

			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn().mockResolvedValue(savedCodeConfirmation),
				findByUserId: jest.fn(),
				deleteById: jest.fn(),
			};

			const res = await service.create(code, expirationDate);

			expect((service as any).codeRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					code,
					expirationDate,
				})
			);
			expect((service as any).codeRepo.findByUserId).not.toHaveBeenCalled();
			expect(res).toEqual(savedCodeConfirmation);
		});

		it('should create a new code confirmation with userId when no existing code found', async () => {
			const code = '654321';
			const expirationDate = new Date('2025-12-31');
			const userId = 5;

			const savedCodeConfirmation = new CodeConfirmationDAO();
			savedCodeConfirmation.id = 10;
			savedCodeConfirmation.code = code;
			savedCodeConfirmation.expirationDate = expirationDate;
			const user = new UserDAO();
			user.id = userId;
			savedCodeConfirmation.user = user;

			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn().mockResolvedValue(savedCodeConfirmation),
				findByUserId: jest.fn().mockResolvedValue(null), // no existing code
				deleteById: jest.fn(),
			};

			const res = await service.create(code, expirationDate, userId);

			expect((service as any).codeRepo.findByUserId).toHaveBeenCalledWith(userId);
			expect((service as any).codeRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					code,
					expirationDate,
					user: expect.objectContaining({ id: userId }),
				})
			);
			expect(res).toEqual(savedCodeConfirmation);
		});

		it('should update existing code confirmation when userId provided and code exists', async () => {
			const code = '999888';
			const expirationDate = new Date('2025-12-31');
			const userId = 3;

			const user = new UserDAO();
			user.id = userId;
			user.username = 'testuser';

			const existingCodeConfirmation = new CodeConfirmationDAO();
			existingCodeConfirmation.id = 7;
			existingCodeConfirmation.code = '111222';
			existingCodeConfirmation.expirationDate = new Date('2025-11-30');
			existingCodeConfirmation.user = user;

			const updatedCodeConfirmation = new CodeConfirmationDAO();
			updatedCodeConfirmation.id = 7;
			updatedCodeConfirmation.code = code;
			updatedCodeConfirmation.expirationDate = expirationDate;
			updatedCodeConfirmation.user = user;

			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn().mockResolvedValue(updatedCodeConfirmation),
				findByUserId: jest.fn().mockResolvedValue(existingCodeConfirmation),
				deleteById: jest.fn(),
			};

			const res = await service.create(code, expirationDate, userId);

			expect((service as any).codeRepo.findByUserId).toHaveBeenCalledWith(userId);
			expect((service as any).codeRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 7,
					code,
					expirationDate,
					user: expect.objectContaining({ id: userId }),
				})
			);
			expect(res).toEqual(updatedCodeConfirmation);
		});

		it('should handle creating code confirmation with far future expiration date', async () => {
			const code = '777888';
			const expirationDate = new Date('2030-01-01');

			const savedCodeConfirmation = new CodeConfirmationDAO();
			savedCodeConfirmation.id = 20;
			savedCodeConfirmation.code = code;
			savedCodeConfirmation.expirationDate = expirationDate;

			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn().mockResolvedValue(savedCodeConfirmation),
				findByUserId: jest.fn(),
				deleteById: jest.fn(),
			};

			const res = await service.create(code, expirationDate);

			expect((service as any).codeRepo.save).toHaveBeenCalled();
			expect(res.expirationDate).toEqual(expirationDate);
		});

		it('should properly assign user to code confirmation when userId provided', async () => {
			const code = '555666';
			const expirationDate = new Date('2025-12-31');
			const userId = 42;

			const savedCodeConfirmation = new CodeConfirmationDAO();
			savedCodeConfirmation.id = 15;
			savedCodeConfirmation.code = code;
			savedCodeConfirmation.expirationDate = expirationDate;
			const user = new UserDAO();
			user.id = userId;
			savedCodeConfirmation.user = user;

			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn().mockResolvedValue(savedCodeConfirmation),
				findByUserId: jest.fn().mockResolvedValue(null),
				deleteById: jest.fn(),
			};

			const res = await service.create(code, expirationDate, userId);

			expect(res.user).toBeDefined();
			expect(res.user.id).toBe(userId);
		});
	});

	describe('deleteById', () => {
		it('should call codeRepo.deleteById with the correct id', async () => {
			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn(),
				findByUserId: jest.fn(),
				deleteById: jest.fn().mockResolvedValue(undefined),
			};

			await service.deleteById(10);

			expect((service as any).codeRepo.deleteById).toHaveBeenCalledWith(10);
			expect((service as any).codeRepo.deleteById).toHaveBeenCalledTimes(1);
		});

		it('should handle deletion of non-existent code confirmation', async () => {
			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn(),
				findByUserId: jest.fn(),
				deleteById: jest.fn().mockResolvedValue(undefined),
			};

			await service.deleteById(999);

			expect((service as any).codeRepo.deleteById).toHaveBeenCalledWith(999);
		});

		it('should delete code confirmation with specific id', async () => {
			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn(),
				findByUserId: jest.fn(),
				deleteById: jest.fn().mockResolvedValue(undefined),
			};

			await service.deleteById(1);

			expect((service as any).codeRepo.deleteById).toHaveBeenCalledWith(1);
		});

		it('should allow multiple deletions', async () => {
			const { CodeConfirmationService } = require('@services/CodeConfirmationService');
			const service = new CodeConfirmationService();

			// @ts-ignore
			service['codeRepo'] = {
				save: jest.fn(),
				findByUserId: jest.fn(),
				deleteById: jest.fn().mockResolvedValue(undefined),
			};

			await service.deleteById(1);
			await service.deleteById(2);
			await service.deleteById(3);

			expect((service as any).codeRepo.deleteById).toHaveBeenCalledTimes(3);
			expect((service as any).codeRepo.deleteById).toHaveBeenNthCalledWith(1, 1);
			expect((service as any).codeRepo.deleteById).toHaveBeenNthCalledWith(2, 2);
			expect((service as any).codeRepo.deleteById).toHaveBeenNthCalledWith(3, 3);
		});
	});
});

