import { initializeTestDatasource, emptyTestData, closeTestDataSource } from '@test/setup/test-datasource';
import { OfficeDAO } from '@daos/OfficeDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { ChatDAO } from '@daos/ChatsDAO';
import * as bcrypt from 'bcryptjs';

let reportController: any;

describe('ReportController integration tests', () => {
  let categoryId: number | undefined;
  let userId: number | undefined;
  let staffId: number | undefined;
  let externalMaintainerId: number | undefined;
  let reportId: number | undefined;

  beforeAll(async () => {
    const AppDataSource = await initializeTestDatasource();
    await emptyTestData();

    const roleRepo = AppDataSource.getRepository(OfficeDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);

    const role = roleRepo.create({ name: 'Controller Test Role' });
    await roleRepo.save(role);

    const category = categoryRepo.create({ name: 'Street Light', office: role });
    await categoryRepo.save(category);
    categoryId = category.id;

    const salt = await bcrypt.genSalt(10);
    const userHash = await bcrypt.hash('cpass', salt);
    const citizen = userRepo.create({
      username: 'controller_citizen',
      email: 'controller_citizen@gmail.com',
      passwordHash: userHash,
      firstName: 'Ctrl',
      lastName: 'Citizen',
      userType: UserType.CITIZEN,
    });
    await userRepo.save(citizen);
    userId = citizen.id;

    const staff = userRepo.create({
      username: 'controller_staff',
      email: 'controller_staff@gmail.com',
      passwordHash: userHash,
      firstName: 'Ctrl',
      lastName: 'Staff',
      userType: UserType.TECHNICAL_STAFF_MEMBER,
      offices: [role]
    });
    await userRepo.save(staff);
    staffId = staff.id;

    const externalMaintainer = userRepo.create({
      username: 'controller_ext_maint',
      email: 'controller_ext@gmail.com',
      passwordHash: userHash,
      firstName: 'External',
      lastName: 'Maintainer',
      userType: UserType.EXTERNAL_MAINTAINER,
    });
    await userRepo.save(externalMaintainer);
    externalMaintainerId = externalMaintainer.id;

    const report = reportRepo.create({
      title: 'Initial Report',
      description: 'Initial Description',
      category: category,
      images: ['https://img/1.jpg'],
      lat: 45.07,
      long: 7.65,
      anonymous: false,
      createdBy: citizen,
      status: ReportStatus.PendingApproval
    });
    await reportRepo.save(report);
    reportId = report.id;

    reportController = (await import('@controllers/ReportController')).reportController;
  });

  afterAll(async () => {
    await emptyTestData();
    await closeTestDataSource();
  });

  it('createReport => valid payload responds 201', async () => {
    const req: any = {
      body: {
        payload: {
          title: 'Lamp broken',
          description: 'Lamp on 3rd street is out',
          categoryId: categoryId,
          images: ['http://img/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      },
      token: { user: { id: userId, role: UserType.CITIZEN } },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await reportController.createReport(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Report successfully created' });
  });

  it('createReport => invalid payload calls next with BadRequestError', async () => {
    const req: any = { body: { payload: { title: 1 } }, token: { user: { id: userId, role: UserType.CITIZEN } } };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.createReport(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('BadRequestError');
  });

  it('createReport => non-existing category calls next with NotFoundError', async () => {
    const req: any = {
      body: {
        payload: {
          title: 'Missing cat',
          description: 'Category not present',
          categoryId: 999999,
          images: ['http://img/1.jpg'],
          lat: 45.07,
          long: 7.65,
          anonymous: false,
        },
      },
      token: { user: { id: userId, role: UserType.CITIZEN } },
    };

    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.createReport(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.name).toBe('NotFoundError');
  });

  it('getReportsByStatus => valid status returns reports', async () => {
    const req: any = { query: { status: ReportStatus.PendingApproval } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await reportController.getReportsByStatus(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      reports: expect.arrayContaining([
        expect.objectContaining({ status: ReportStatus.PendingApproval })
      ])
    }));
  });

  it('getReportsByStatus => invalid status calls next with BadRequestError', async () => {
    const req: any = { query: { status: 'INVALID_STATUS' } };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.getReportsByStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
  });

  it('updateReportCategory => valid category updates report', async () => {
    const req: any = { 
      params: { id: String(reportId) }, 
      body: { categoryId: categoryId },
      token: { user: { id: userId, role: UserType.CITIZEN } }
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await reportController.updateReportCategory(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Report category updated',
      report: expect.objectContaining({ id: reportId })
    }));
  });

  it('assignOrRejectReport => assign valid report', async () => {
    const req: any = {
      params: { id: String(reportId) },
      body: { status: ReportStatus.Assigned },
      token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await reportController.assignOrRejectReport(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Report assigned to'),
      report: expect.objectContaining({ status: ReportStatus.Assigned })
    }));
  });

  it('getReportsByStatus => missing status calls next with BadRequestError', async () => {
    const req: any = { query: {} };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.getReportsByStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('status');
  });

  it('assignOrRejectReport => invalid id calls next with BadRequestError', async () => {
    const req: any = {
      params: { id: 'invalid' },
      body: { status: ReportStatus.Assigned },
      token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.assignOrRejectReport(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('id');
  });

  it('assignOrRejectReport => invalid status calls next with BadRequestError', async () => {
    const req: any = {
      params: { id: String(reportId) },
      body: { status: 'INVALID' },
      token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.assignOrRejectReport(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('status');
  });

  it('assignOrRejectReport => rejected without description calls next with BadRequestError', async () => {
    const req: any = {
      params: { id: String(reportId) },
      body: { status: ReportStatus.Rejected },
      token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.assignOrRejectReport(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('rejectedDescription');
  });

  it('getAssignedReports => returns reports for authenticated tech user', async () => {
    const AppDataSource = await import('@database').then(m => m.AppDataSource);
    const reportRepo = AppDataSource.getRepository(ReportDAO);
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);

    const category = await categoryRepo.findOne({ where: { id: categoryId } });
    const staff = await userRepo.findOne({ where: { id: staffId } });
    const citizen = await userRepo.findOne({ where: { id: userId } });

    if (!category || !staff || !citizen) {
      throw new Error('Setup failed: required entities not found');
    }

    const report = new ReportDAO();
    report.title = 'Assigned to Staff';
    report.description = 'Test';
    report.category = category;
    report.images = ['https://img/1.jpg'];
    report.lat = 45.07;
    report.long = 7.65;
    report.anonymous = false;
    report.createdBy = citizen;
    report.status = ReportStatus.Assigned;
    report.assignedTo = staff;
    await reportRepo.save(report);

    const req: any = {
      token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await reportController.getAssignedReports(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      reports: expect.arrayContaining([
        expect.objectContaining({ 
          title: 'Assigned to Staff',
          status: ReportStatus.Assigned 
        })
      ])
    }));
  });

  it('getAssignedReports => calls next with error if userId missing', async () => {
    const req: any = {
      token: { user: {} }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.getAssignedReports(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('auth');
  });

  it('updateReportCategory => invalid id calls next with BadRequestError', async () => {
    const req: any = { 
      params: { id: 'invalid' }, 
      body: { categoryId: categoryId },
      token: { user: { id: userId, role: UserType.CITIZEN } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.updateReportCategory(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('id');
  });

  it('updateReportCategory => invalid categoryId calls next with BadRequestError', async () => {
    const req: any = { 
      params: { id: String(reportId) }, 
      body: { categoryId: 'invalid' },
      token: { user: { id: userId, role: UserType.CITIZEN } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.updateReportCategory(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('categoryId');
  });

  it('updateReportStatus => invalid id calls next with BadRequestError', async () => {
    const req: any = {
      params: { id: 'invalid' },
      body: { status: ReportStatus.InProgress },
      token: { user: { id: staffId, userType: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.updateReportStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('id');
  });

  it('updateReportStatus => invalid status calls next with BadRequestError', async () => {
    const req: any = {
      params: { id: String(reportId) },
      body: { status: 'INVALID_STATUS' },
      token: { user: { id: staffId, userType: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.updateReportStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('status');
  });

  it('updateReportStatus => missing status calls next with BadRequestError', async () => {
    const req: any = {
      params: { id: String(reportId) },
      body: {},
      token: { user: { id: staffId, userType: UserType.TECHNICAL_STAFF_MEMBER } }
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.updateReportStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.errors).toHaveProperty('status');
  });

  it('updateReportStatus => missing token calls next with BadRequestError', async () => {
    const req: any = {
      params: { id: String(reportId) },
      body: { status: ReportStatus.InProgress },
      token: {}
    };
    const res: any = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await reportController.updateReportStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.name).toBe('BadRequestError');
    expect(err.message).toContain('Missing token');
  });

  describe('assignOrRejectReport with chat creation', () => {
    it('should create chat between citizen and TOSM when report is assigned', async () => {
      const AppDataSource = await import('@database').then(m => m.AppDataSource);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const chatRepo = AppDataSource.getRepository(ChatDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);

      const category = await categoryRepo.findOne({ where: { id: categoryId } });
      const staff = await userRepo.findOne({ where: { id: staffId } });
      const citizen = await userRepo.findOne({ where: { id: userId } });

      if (!category || !staff || !citizen) {
        throw new Error('Setup failed: required entities not found');
      }

      // Create a new pending report
      const newReport = reportRepo.create({
        title: 'Chat Test Report',
        description: 'Testing chat creation',
        category: category,
        images: ['https://img/test.jpg'],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
        createdBy: citizen,
        status: ReportStatus.PendingApproval
      });
      await reportRepo.save(newReport);

      const req: any = {
        params: { id: String(newReport.id) },
        body: { status: ReportStatus.Assigned },
        token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await reportController.assignOrRejectReport(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);

      // Check that chat was created
      const chats = await chatRepo.find({ 
        where: { report: { id: newReport.id } },
        relations: ['tosm_user', 'second_user', 'report']
      });

      expect(chats.length).toBe(1);
      expect(chats[0].tosm_user.id).toBe(staffId);
      expect(chats[0].second_user.id).toBe(userId);
      expect(chats[0].report.id).toBe(newReport.id);

      // Cleanup - remove chats first to avoid FK constraints
      await chatRepo.remove(chats);
    });

    it('should not create duplicate chat if one already exists', async () => {
      const AppDataSource = await import('@database').then(m => m.AppDataSource);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const chatRepo = AppDataSource.getRepository(ChatDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);

      const category = await categoryRepo.findOne({ where: { id: categoryId } });
      const staff = await userRepo.findOne({ where: { id: staffId } });
      const citizen = await userRepo.findOne({ where: { id: userId } });

      if (!category || !staff || !citizen) {
        throw new Error('Setup failed: required entities not found');
      }

      const newReport = reportRepo.create({
        title: 'No Duplicate Chat Test',
        description: 'Testing no duplicate chat',
        category: category,
        images: ['https://img/test2.jpg'],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
        createdBy: citizen,
        status: ReportStatus.PendingApproval
      });
      await reportRepo.save(newReport);

      // First assignment - creates chat
      const req1: any = {
        params: { id: String(newReport.id) },
        body: { status: ReportStatus.Assigned },
        token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
      };
      const res1: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next1 = jest.fn();

      await reportController.assignOrRejectReport(req1, res1, next1);

      const chatsAfterFirst = await chatRepo.find({ 
        where: { report: { id: newReport.id } }
      });
      expect(chatsAfterFirst.length).toBe(1);

      // Second assignment - should not create duplicate
      const req2: any = {
        params: { id: String(newReport.id) },
        body: { status: ReportStatus.Assigned },
        token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
      };
      const res2: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next2 = jest.fn();

      await reportController.assignOrRejectReport(req2, res2, next2);

      const chatsAfterSecond = await chatRepo.find({ 
        where: { report: { id: newReport.id } }
      });
      expect(chatsAfterSecond.length).toBe(1); // Still only 1 chat

      // Cleanup - remove chats first to avoid FK constraints
      await chatRepo.remove(chatsAfterSecond);
    });

    it('should not create chat when report is rejected', async () => {
      const AppDataSource = await import('@database').then(m => m.AppDataSource);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const chatRepo = AppDataSource.getRepository(ChatDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);

      const category = await categoryRepo.findOne({ where: { id: categoryId } });
      const citizen = await userRepo.findOne({ where: { id: userId } });

      if (!category || !citizen) {
        throw new Error('Setup failed: required entities not found');
      }

      const newReport = reportRepo.create({
        title: 'Rejected Report Test',
        description: 'Testing no chat on rejection',
        category: category,
        images: ['https://img/test3.jpg'],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
        createdBy: citizen,
        status: ReportStatus.PendingApproval
      });
      await reportRepo.save(newReport);

      const req: any = {
        params: { id: String(newReport.id) },
        body: { status: ReportStatus.Rejected, rejectedDescription: 'Not valid' },
        token: { user: { id: staffId, role: UserType.TECHNICAL_STAFF_MEMBER } }
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await reportController.assignOrRejectReport(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);

      // Check that no chat was created
      const chats = await chatRepo.find({ 
        where: { report: { id: newReport.id } }
      });
      expect(chats.length).toBe(0);
    });
  });

  describe('assignExternalMaintainer', () => {
    it('should assign external maintainer and create chat with TOSM', async () => {
      const AppDataSource = await import('@database').then(m => m.AppDataSource);
      const reportRepo = AppDataSource.getRepository(ReportDAO);
      const chatRepo = AppDataSource.getRepository(ChatDAO);
      const categoryRepo = AppDataSource.getRepository(CategoryDAO);
      const userRepo = AppDataSource.getRepository(UserDAO);

      const category = await categoryRepo.findOne({ where: { id: categoryId } });
      const staff = await userRepo.findOne({ where: { id: staffId } });
      const citizen = await userRepo.findOne({ where: { id: userId } });
      const extMaintainer = await userRepo.findOne({ where: { id: externalMaintainerId } });

      if (!category || !staff || !citizen || !extMaintainer) {
        throw new Error('Setup failed: required entities not found');
      }

      // Create assigned report with existing citizen-TOSM chat
      const newReport = reportRepo.create({
        title: 'External Maintainer Test',
        description: 'Testing external maintainer assignment',
        category: category,
        images: ['https://img/ext.jpg'],
        lat: 45.07,
        long: 7.65,
        anonymous: false,
        createdBy: citizen,
        status: ReportStatus.Assigned,
        assignedTo: staff
      });
      await reportRepo.save(newReport);

      // Create initial citizen-TOSM chat
      const initialChat = chatRepo.create({
        tosm_user: staff,
        second_user: citizen,
        report: newReport,
        chatType: 'CITIZEN_TOSM' as any
      });
      await chatRepo.save(initialChat);

      const req: any = {
        params: { id: String(newReport.id) },
        body: { maintainerId: externalMaintainerId },
        token: { user: { id: staffId, userType: UserType.TECHNICAL_STAFF_MEMBER } }
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await reportController.assignExternalMaintainer(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);

      // Check that second chat was created (TOSM-External)
      const chats = await chatRepo.find({ 
        where: { report: { id: newReport.id } },
        relations: ['tosm_user', 'second_user', 'report']
      });

      expect(chats.length).toBe(2);
      
      const extChat = chats.find(c => c.second_user.id === externalMaintainerId);
      expect(extChat).toBeDefined();
      expect(extChat?.tosm_user.id).toBe(staffId);

      // Cleanup
      await chatRepo.remove(chats);
      await reportRepo.remove(newReport);
    });

    it('should fail with invalid report id', async () => {
      const req: any = {
        params: { id: 'invalid' },
        body: { maintainerId: externalMaintainerId },
        token: { user: { id: staffId, userType: UserType.TECHNICAL_STAFF_MEMBER } }
      };
      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await reportController.assignExternalMaintainer(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toContain('Report id must be a positive number');
    });

    it('should fail with missing user id in token', async () => {
      const req: any = {
        params: { id: String(reportId) },
        body: { maintainerId: externalMaintainerId },
        token: { user: {} }
      };
      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await reportController.assignExternalMaintainer(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toContain('Missing user id in token');
    });

    it('should fail with invalid maintainer id', async () => {
      const req: any = {
        params: { id: String(reportId) },
        body: { maintainerId: -5 },
        token: { user: { id: staffId, userType: UserType.TECHNICAL_STAFF_MEMBER } }
      };
      const res: any = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();

      await reportController.assignExternalMaintainer(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.name).toBe('BadRequestError');
      expect(err.message).toContain('maintainerId is missing or it is not a positive number');
    });
  });
});
