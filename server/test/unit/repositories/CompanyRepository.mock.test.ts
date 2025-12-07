import { CompanyDAO } from '@daos/CompanyDAO';

describe('CompanyRepository (mock)', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it('findAllCompanies should call underlying repo.find with relations and return array', async () => {
		const c1 = new CompanyDAO();
		c1.id = 1;
		c1.name = 'External Company A';
		c1.categories = [];

		const c2 = new CompanyDAO();
		c2.id = 2;
		c2.name = 'External Company B';
		c2.categories = [];

		const fakeRepo: any = {
			find: jest.fn().mockResolvedValue([c1, c2]),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CompanyRepository } = require('@repositories/CompanyRepository');
		const repo = new CompanyRepository();
		const res = await repo.findAllCompanies();

		expect(fakeRepo.find).toHaveBeenCalledWith({ relations: { categories: true } });
		expect(res).toEqual([c1, c2]);
	});

	it('findCompanyById should call underlying repo.findOneBy and return the DAO', async () => {
		const company = new CompanyDAO();
		company.id = 1;
		company.name = 'Test Company';

		const fakeRepo: any = {
			findOneBy: jest.fn().mockResolvedValue(company),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CompanyRepository } = require('@repositories/CompanyRepository');
		const repo = new CompanyRepository();
		const res = await repo.findCompanyById(1);

		expect(fakeRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
		expect(res).toEqual(company);
	});

	it('findCompanyById should return null when company does not exist', async () => {
		const fakeRepo: any = {
			findOneBy: jest.fn().mockResolvedValue(null),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CompanyRepository } = require('@repositories/CompanyRepository');
		const repo = new CompanyRepository();
		const res = await repo.findCompanyById(999);

		expect(fakeRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
		expect(res).toBeNull();
	});

	it('createNewCompany should call underlying repo.save and return saved company', async () => {
		const company = new CompanyDAO();
		company.name = 'New Company';
		company.categories = [];

		const savedCompany = { ...company, id: 1 };

		const fakeRepo: any = {
			save: jest.fn().mockResolvedValue(savedCompany),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CompanyRepository } = require('@repositories/CompanyRepository');
		const repo = new CompanyRepository();
		const res = await repo.createNewCompany(company);

		expect(fakeRepo.save).toHaveBeenCalledWith(company);
		expect(res).toEqual(savedCompany);
	});

	it('doesCompanyExists should return true when company exists', async () => {
		const fakeRepo: any = {
			exists: jest.fn().mockResolvedValue(true),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CompanyRepository } = require('@repositories/CompanyRepository');
		const repo = new CompanyRepository();
		const res = await repo.doesCompanyExists('Existing Company');

		expect(fakeRepo.exists).toHaveBeenCalledWith({ where: { name: 'Existing Company' } });
		expect(res).toBe(true);
	});

	it('doesCompanyExists should return false when company does not exist', async () => {
		const fakeRepo: any = {
			exists: jest.fn().mockResolvedValue(false),
		};

		const database = require('@database');
		jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

		const { CompanyRepository } = require('@repositories/CompanyRepository');
		const repo = new CompanyRepository();
		const res = await repo.doesCompanyExists('Non-existing Company');

		expect(fakeRepo.exists).toHaveBeenCalledWith({ where: { name: 'Non-existing Company' } });
		expect(res).toBe(false);
	});
});