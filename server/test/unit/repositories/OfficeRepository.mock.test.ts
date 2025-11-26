import { OfficeDAO } from '@daos/OfficeDAO';

describe('OfficeRepository (mock)', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('findOfficeById should call underlying repo.findOneBy and return the DAO', async () => {
        const office = new OfficeDAO();
        office.id = 1;
        office.name = 'Public Services Division'; // canonical office name from test-datasource

        const fakeRepo: any = {
            findOneBy: jest.fn().mockResolvedValue(office),
            find: jest.fn(),
        };

        const database = require('@database');
        jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

        // require the repository after mocking the AppDataSource
        const { OfficeRepository } = require('@repositories/OfficeRepository');
        const repo = new OfficeRepository();
        const res = await repo.findOfficeById(1);

        expect(fakeRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(res).toEqual(office);
    });

    it('findAllOffices should call underlying repo.find and return array', async () => {
        const o1 = new OfficeDAO();
        o1.id = 1;
        o1.name = 'Public Services Division';
        const o2 = new OfficeDAO();
        o2.id = 2;
        o2.name = 'Infrastructure Division';

        const fakeRepo: any = {
            find: jest.fn().mockResolvedValue([o1, o2]),
        };

        const database = require('@database');
        jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

        const { OfficeRepository } = require('@repositories/OfficeRepository');
        const repo = new OfficeRepository();
        const res = await repo.findAllOffices();

        expect(fakeRepo.find).toHaveBeenCalled();
        expect(res).toEqual([o1, o2]);
    });

    it('findOrganizationOffice should call findOneBy with name "Organization" and return the DAO', async () => {
        const orgOffice = new OfficeDAO();
        orgOffice.id = 1;
        orgOffice.name = 'Organization';

        const fakeRepo: any = {
            findOneBy: jest.fn().mockResolvedValue(orgOffice),
        };

        const database = require('@database');
        jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

        const { OfficeRepository } = require('@repositories/OfficeRepository');
        const repo = new OfficeRepository();
        const res = await repo.findOrganizationOffice();

        expect(fakeRepo.findOneBy).toHaveBeenCalledWith({ name: 'Organization' });
        expect(res).toEqual(orgOffice);
    });

    it('findOrganizationOffice should return null when Organization office does not exist', async () => {
        const fakeRepo: any = {
            findOneBy: jest.fn().mockResolvedValue(null),
        };

        const database = require('@database');
        jest.spyOn(database.AppDataSource, 'getRepository').mockImplementation(() => fakeRepo);

        const { OfficeRepository } = require('@repositories/OfficeRepository');
        const repo = new OfficeRepository();
        const res = await repo.findOrganizationOffice();

        expect(fakeRepo.findOneBy).toHaveBeenCalledWith({ name: 'Organization' });
        expect(res).toBeNull();
    });
});
