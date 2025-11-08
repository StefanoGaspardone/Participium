import {officeRepository, OfficeRepository} from "@repositories/OfficeRepository";
import {mapOfficeDAOtoDTO, OfficeDTO} from "@dtos/OfficeDTO";

export class OfficeService {

    private officeRepo: OfficeRepository;

    constructor() {
        this.officeRepo = officeRepository;
    }

    findAllOffices = async (): Promise<OfficeDTO[]> => {
        const offices = await this.officeRepo.findAllOffices();
        return offices.map(mapOfficeDAOtoDTO);
    }
}

export const officeService = new OfficeService();