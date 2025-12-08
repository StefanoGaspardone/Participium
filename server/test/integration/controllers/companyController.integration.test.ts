import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { CompanyDAO } from '@daos/CompanyDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { ConflictError } from '@errors/ConflictError';
import { BadRequestError } from '@errors/BadRequestError';
import * as bcrypt from 'bcryptjs';

let companyController: any;

describe('CompanyController integration tests', () => {
  let AppDataSource: any;
  let categoryId: number;
  let category2Id: number;
  let adminId: number;

  beforeAll(async () => {
    AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const officeRepo = AppDataSource.getRepository(OfficeDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const companyRepo = AppDataSource.getRepository(CompanyDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);

    // Create office and categories
    const office = officeRepo.create({ name: 'Test Office for Companies' });
    await officeRepo.save(office);

    const category = categoryRepo.create({ name: 'Test Category', office });
    const category2 = categoryRepo.create({ name: 'Test Category 2', office });
    await categoryRepo.save(category);
    await categoryRepo.save(category2);
    categoryId = category.id;
    category2Id = category2.id;

    // Create a test company
    const company = companyRepo.create({
      name: 'Existing Test Company',
      categories: [category]
    });
    await companyRepo.save(company);

    // Create test admin user
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('adminpass', salt);
    const admin = userRepo.create({
      username: 'controller_admin',
      email: 'controller_admin@gmail.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      userType: UserType.ADMINISTRATOR,
    });
    await userRepo.save(admin);
    adminId = admin.id;

    // import controller after DB is initialized
    companyController = (await import('@controllers/CompanyController')).companyController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  describe('getAllCompanies', () => {
    it('should return companies wrapped in { companies }', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.getAllCompanies(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body).toHaveProperty('companies');
      expect(Array.isArray(body.companies)).toBe(true);
      expect(body.companies.length).toBeGreaterThan(0);
      
      const names = body.companies.map((c: any) => c.name);
      expect(names).toContain('Existing Test Company');
      
      // Verify companies include their categories
      const existingCompany = body.companies.find((c: any) => c.name === 'Existing Test Company');
      expect(existingCompany).toBeDefined();
      expect(existingCompany.categories).toBeDefined();
      expect(Array.isArray(existingCompany.categories)).toBe(true);
    });

    it('should call next with BadRequestError when token is missing', async () => {
      const req: any = {};
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.getAllCompanies(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('Invalid token');
    });

    it('should call next with BadRequestError when user is missing from token', async () => {
      const req: any = {
        token: {}
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.getAllCompanies(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('Invalid token');
    });

    it('should call next on service error', async () => {
      const originalService = companyController.companyService;
      companyController.companyService = { 
        getAllCompanies: jest.fn().mockRejectedValue(new Error('Database error')) 
      } as any;

      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.getAllCompanies(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('Database error');

      companyController.companyService = originalService;
    });
  });

  describe('createCompany', () => {
    it('should create company and return 201 with company data', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: `Controller Test Company ${Date.now()}`,
          categories: [{ id: categoryId, name: 'Test Category' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('name');
      expect(body).toHaveProperty('categories');
      expect(body.categories).toHaveLength(1);
      expect(body.categories[0]).toHaveProperty('id');
      expect(body.categories[0]).toHaveProperty('name');
    });

    it('should create company with multiple categories', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: `Multi Category Company ${Date.now()}`,
          categories: [
            { id: categoryId, name: 'Test Category' },
            { id: category2Id, name: 'Test Category 2' }
          ]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const body = res.json.mock.calls[0][0];
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('name');
      expect(body.categories).toHaveLength(2);
    });

    it('should call next with BadRequestError when token is missing', async () => {
      const req: any = {
        body: {
          name: 'Test Company',
          categories: [{ id: categoryId, name: 'Test Category' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('Invalid token');
    });

    it('should call next with BadRequestError when user is missing from token', async () => {
      const req: any = {
        token: {},
        body: {
          name: 'Test Company',
          categories: [{ id: categoryId, name: 'Test Category' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('Invalid token');
    });

    it('should call next with BadRequestError when name is missing', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          categories: [{ id: categoryId, name: 'Test Category' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('A name for the company must be specified');
    });

    it('should call next with BadRequestError when categories is missing', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: 'Test Company'
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('A set of categories for the company must be specified');
    });

    it('should call next with BadRequestError when name is empty', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: '',
          categories: [{ id: categoryId, name: 'Test Category' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    });

    it('should call next with BadRequestError when name is only whitespace', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: '   ',
          categories: [{ id: categoryId, name: 'Test Category' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    });

    it('should call next with BadRequestError when categories is empty array', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: 'Test Company',
          categories: []
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    });

    it('should call next with ConflictError when company name already exists', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: 'Existing Test Company',
          categories: [{ id: categoryId, name: 'Test Category' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ConflictError);
      expect(next.mock.calls[0][0].message).toBe('A company with the selected name already exists');
    });

    it('should call next with BadRequestError when category does not exist', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: `Nonexistent Cat ${Date.now()}`,
          categories: [{ id: 99999, name: 'Nonexistent' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('A category inserted is not present on the list of existing categories');
    });

    it('should call next with BadRequestError when one of multiple categories does not exist', async () => {
      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: `Mixed Categories ${Date.now()}`,
          categories: [
            { id: categoryId, name: 'Test Category' },
            { id: 88888, name: 'Nonexistent' }
          ]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    });

    it('should call next on service error', async () => {
      const originalService = companyController.companyService;
      companyController.companyService = { 
        createCompany: jest.fn().mockRejectedValue(new Error('Unexpected error')) 
      } as any;

      const req: any = {
        token: { user: { id: adminId, role: UserType.ADMINISTRATOR } },
        body: {
          name: 'Test',
          categories: [{ id: 1, name: 'Test' }]
        }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await companyController.createCompany(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('Unexpected error');

      companyController.companyService = originalService;
    });
  });
});
