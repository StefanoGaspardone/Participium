import { CompanyService } from '@services/CompanyService';
import { CompanyDAO } from '@daos/CompanyDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { CreateCompanyDTO } from '@dtos/CompanyDTO';

describe('CompanyService (mock)', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it('createCompany should create a new company with valid categories', async () => {
		const service = new CompanyService();

		const cat1 = new CategoryDAO();
		cat1.id = 1;
		cat1.name = 'Water Supply';

		const cat2 = new CategoryDAO();
		cat2.id = 2;
		cat2.name = 'Public Lighting';

		const savedCompany = new CompanyDAO();
		savedCompany.id = 1;
		savedCompany.name = 'Test Company';
		savedCompany.categories = [cat1, cat2];

		// @ts-ignore
		service['companyRepo'] = {
			doesCompanyExists: jest.fn().mockResolvedValue(false),
			createNewCompany: jest.fn().mockResolvedValue(savedCompany),
		};

		// @ts-ignore
		service['categoryRepo'] = {
			findAllCategories: jest.fn().mockResolvedValue([cat1, cat2]),
			findCategoryById: jest.fn().mockImplementation((id: number) => {
				if (id === 1) return Promise.resolve(cat1);
				if (id === 2) return Promise.resolve(cat2);
				return Promise.resolve(null);
			}),
		};

		const payload: CreateCompanyDTO = {
			name: 'Test Company',
			categories: [
				{ id: 1, name: 'Water Supply' },
				{ id: 2, name: 'Public Lighting' },
			],
		};

		const result = await service.createCompany(payload);

		expect((service as any).companyRepo.doesCompanyExists).toHaveBeenCalledWith('Test Company');
		expect((service as any).categoryRepo.findCategoryById).toHaveBeenCalledWith(1);
		expect((service as any).categoryRepo.findCategoryById).toHaveBeenCalledWith(2);
		expect((service as any).companyRepo.createNewCompany).toHaveBeenCalled();
		expect(result.id).toBe(1);
		expect(result.name).toBe('Test Company');
	});

	it('createCompany should throw ConflictError if company already exists', async () => {
		const service = new CompanyService();

		// @ts-ignore
		service['companyRepo'] = {
			doesCompanyExists: jest.fn().mockResolvedValue(true),
		};

		const payload: CreateCompanyDTO = {
			name: 'Existing Company',
			categories: [],
		};

		await expect(service.createCompany(payload)).rejects.toThrow('A company with the selected name already exists');
	});

	it('createCompany should throw BadRequestError if category does not exist in database', async () => {
		const service = new CompanyService();

		const cat1 = new CategoryDAO();
		cat1.id = 1;
		cat1.name = 'Water Supply';

		// @ts-ignore
		service['companyRepo'] = {
			doesCompanyExists: jest.fn().mockResolvedValue(false),
		};

		// @ts-ignore
		service['categoryRepo'] = {
			findAllCategories: jest.fn().mockResolvedValue([cat1]),
		};

		const payload: CreateCompanyDTO = {
			name: 'Test Company',
			categories: [{ id: 999, name: 'Invalid Category' }],
		};

		await expect(service.createCompany(payload)).rejects.toThrow('A category inserted is not present on the list of existing categories');
	});

	it('createCompany should throw NotFoundError if category id is not found during creation', async () => {
		const service = new CompanyService();

		const cat1 = new CategoryDAO();
		cat1.id = 1;
		cat1.name = 'Water Supply';

		// @ts-ignore
		service['companyRepo'] = {
			doesCompanyExists: jest.fn().mockResolvedValue(false),
		};

		// @ts-ignore
		service['categoryRepo'] = {
			findAllCategories: jest.fn().mockResolvedValue([cat1]),
			findCategoryById: jest.fn().mockResolvedValue(null),
		};

		const payload: CreateCompanyDTO = {
			name: 'Test Company',
			categories: [{ id: 1, name: 'Water Supply' }],
		};

		await expect(service.createCompany(payload)).rejects.toThrow('Category 1 not found');
	});

	it('createCompany should trim company name before checking existence', async () => {
		const service = new CompanyService();

		const savedCompany = new CompanyDAO();
		savedCompany.id = 1;
		savedCompany.name = 'Test Company';
		savedCompany.categories = [];

		// @ts-ignore
		service['companyRepo'] = {
			doesCompanyExists: jest.fn().mockResolvedValue(false),
			createNewCompany: jest.fn().mockResolvedValue(savedCompany),
		};

		// @ts-ignore
		service['categoryRepo'] = {
			findAllCategories: jest.fn().mockResolvedValue([]),
		};

		const payload: CreateCompanyDTO = {
			name: '  Test Company  ',
			categories: [],
		};

		await service.createCompany(payload);

		expect((service as any).companyRepo.doesCompanyExists).toHaveBeenCalledWith('Test Company');
	});

	it('getAllCompanies should return all companies mapped to DTOs', async () => {
		const service = new CompanyService();

		const c1 = new CompanyDAO();
		c1.id = 1;
		c1.name = 'Company A';
		c1.categories = [];

		const c2 = new CompanyDAO();
		c2.id = 2;
		c2.name = 'Company B';
		c2.categories = [];

		// @ts-ignore
		service['companyRepo'] = {
			findAllCompanies: jest.fn().mockResolvedValue([c1, c2]),
		};

		const result = await service.getAllCompanies();

		expect((service as any).companyRepo.findAllCompanies).toHaveBeenCalled();
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe(1);
		expect(result[0].name).toBe('Company A');
		expect(result[1].id).toBe(2);
		expect(result[1].name).toBe('Company B');
	});

	it('getAllCompanies should return empty array when no companies exist', async () => {
		const service = new CompanyService();

		// @ts-ignore
		service['companyRepo'] = {
			findAllCompanies: jest.fn().mockResolvedValue([]),
		};

		const result = await service.getAllCompanies();

		expect((service as any).companyRepo.findAllCompanies).toHaveBeenCalled();
		expect(result).toEqual([]);
	});
});
