import { OfficeDAO } from '@daos/OfficeDAO';

describe('OfficeService (mock)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('findAllOffices should map DAOs to DTOs using mapper', async () => {
    const o1 = new OfficeDAO();
    o1.id = 1;
    o1.name = 'Public Services Division';
    const o2 = new OfficeDAO();
    o2.id = 2;
    o2.name = 'Infrastructure Division';

    // mock mapper before requiring service so the service picks up the mocked function
    const dtosModule = require('@dtos/OfficeDTO');
    jest.spyOn(dtosModule, 'mapOfficeDAOtoDTO').mockImplementation((d: any) => ({ id: d.id, title: d.name }));

    // require OfficeService after mocking the mapper
    const { OfficeService } = require('@services/OfficeService');
    const service = new OfficeService();

    // inject a fake officeRepo
    // @ts-ignore
    service['officeRepo'] = { findAllOffices: jest.fn().mockResolvedValue([o1, o2]) };

    const res = await service.findAllOffices();

    expect((service as any).officeRepo.findAllOffices).toHaveBeenCalled();
    expect(dtosModule.mapOfficeDAOtoDTO).toHaveBeenCalledTimes(2);
    expect(res).toEqual([{ id: 1, title: 'Public Services Division' }, { id: 2, title: 'Infrastructure Division' }]);
  });

  it('findAllOffices should return empty array when repo returns none', async () => {
    const dtosModule = require('@dtos/OfficeDTO');
    const spy = jest.spyOn(dtosModule, 'mapOfficeDAOtoDTO');
    spy.mockClear();

    const { OfficeService } = require('@services/OfficeService');
    const service = new OfficeService();

    // @ts-ignore
    service['officeRepo'] = { findAllOffices: jest.fn().mockResolvedValue([]) };

    const res = await service.findAllOffices();

    expect((service as any).officeRepo.findAllOffices).toHaveBeenCalled();
    expect(res).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});
