import { CategoryDAO } from '@daos/CategoryDAO';

describe('CategoryRepository (mock)', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it('findCategoryById should call underlying repo.findOne and return the DAO', async () => {
		const category = new CategoryDAO();
		category.id = 1;
		category.name = 'Water Supply - Drinking Water';

		const fakeRepo: any = {
			findOne: jest.fn().mockResolvedValue(category),
			find: jest.fn(),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CategoryRepository } = require('@repositories/CategoryRepository');
		const repo = new CategoryRepository();
		const res = await repo.findCategoryById(1);

		expect(fakeRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
		expect(res).toEqual(category);
	});

	it('findAllCategories should call underlying repo.find and return array', async () => {
		const c1 = new CategoryDAO();
		c1.id = 1;
		c1.name = 'Water Supply - Drinking Water';
		const c2 = new CategoryDAO();
		c2.id = 2;
		c2.name = 'Public Lighting';

		const fakeRepo: any = {
			findOne: jest.fn(),
			find: jest.fn().mockResolvedValue([c1, c2]),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CategoryRepository } = require('@repositories/CategoryRepository');
		const repo = new CategoryRepository();
		const res = await repo.findAllCategories();

		expect(fakeRepo.find).toHaveBeenCalled();
		expect(res).toEqual([c1, c2]);
	});
});

