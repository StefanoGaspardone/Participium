import { CategoryDAO } from '@daos/CategoryDAO';

describe('CategoryService (mock)', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it('findAllCategories should map DAOs to DTOs using createCategoryDTO', async () => {
		const c1 = new CategoryDAO();
		c1.id = 1;
		c1.name = 'Water Supply - Drinking Water';
		const c2 = new CategoryDAO();
		c2.id = 2;
		c2.name = 'Public Lighting';

		// mock mapper before requiring service so the service picks up the mocked function
		const dtosModule = require('@dtos/CategoryDTO');
		jest.spyOn(dtosModule, 'createCategoryDTO').mockImplementation((d: any) => ({ id: d.id, name: d.name }));

		// require CategoryService after mocking the mapper
		const { CategoryService } = require('@services/CategoryService');
		const service = new CategoryService();

		// inject a fake categoryRepo
		// @ts-ignore
		service['categoryRepo'] = { findAllCategories: jest.fn().mockResolvedValue([c1, c2]) };

		const res = await service.findAllCategories();

		expect((service).categoryRepo.findAllCategories).toHaveBeenCalled();
		expect(dtosModule.createCategoryDTO).toHaveBeenCalledTimes(2);
		expect(res).toEqual([{ id: 1, name: 'Water Supply - Drinking Water' }, { id: 2, name: 'Public Lighting' }]);
	});

	it('findAllCategories should return empty array when repo returns none', async () => {
		const dtosModule = require('@dtos/CategoryDTO');
		const spy = jest.spyOn(dtosModule, 'createCategoryDTO');
		spy.mockClear();

		const { CategoryService } = require('@services/CategoryService');
		const service = new CategoryService();

		// @ts-ignore
		service['categoryRepo'] = { findAllCategories: jest.fn().mockResolvedValue([]) };

		const res = await service.findAllCategories();

		expect((service).categoryRepo.findAllCategories).toHaveBeenCalled();
		expect(res).toEqual([]);
		expect(spy).not.toHaveBeenCalled();
	});
});

