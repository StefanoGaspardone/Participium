import { ReportRepository } from '@repositories/ReportRepository';
import { ReportDAO } from '@daos/ReportDAO';

describe('ReportRepository (mock)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });
  it('createReport should call underlying repo.save and return value', async () => {
    const fakeRepo: any = {
      save: jest.fn().mockImplementation(async (r: any) => ({ ...r, id: 1 })),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();

  const r = { title: ' My Report ' } as ReportDAO;
    const saved = await repo.createReport(r);

    expect(fakeRepo.save).toHaveBeenCalledTimes(1);
    expect(saved.id).toBeDefined();
    expect(saved).toEqual(expect.objectContaining({ title: ' My Report ' }));
  });

  it('createReport should propagate errors from underlying repo.save', async () => {
    const fakeRepo: any = {
      save: jest.fn().mockRejectedValue(new Error('save failure')),
    };

    const database = require('@database');
    jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

    const repo = new ReportRepository();

    const r = { title: 'Bad Save' } as ReportDAO;
    await expect(repo.createReport(r)).rejects.toThrow('save failure');
  });
});
