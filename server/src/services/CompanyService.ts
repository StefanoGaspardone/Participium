import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { createReportDTO, CreateReportDTO, ReportDTO } from '@dtos/ReportDTO';
import { UserDAO } from '@daos/UserDAO';
import { NotFoundError } from '@errors/NotFoundError';
import { BadRequestError } from '@errors/BadRequestError';
import { categoryRepository, CategoryRepository } from '@repositories/CategoryRepository';
import { userRepository, UserRepository } from '@repositories/UserRepository';
import { CompanyRepository, companyRepository } from '@repositories/CompanyRepository';
import { CreateCompanyDTO, CompanyDTO, mapCompanyDAOtoDTO } from '@dtos/CompanyDTO';
import { ConflictError } from '@errors/ConflictError';
import { createCategoryDTO } from '@dtos/CategoryDTO';
import { CompanyDAO } from '@daos/CompanyDAO';
import { CategoryDAO } from '@daos/CategoryDAO';

export class CompanyService {

    private companyRepo: CompanyRepository;
    private categoryRepo: CategoryRepository;
    private userRepo: UserRepository;

    constructor() {
        this.companyRepo = companyRepository;
        this.categoryRepo = categoryRepository;
        this.userRepo = userRepository;
    }

    /**
     * function to create a Company
     * @param createCompanyDTO: CreateCompanyDTO, contains the necessary fields to create a new company
     * { name: string, categories: CategoryDTO[] }
     * @returns a CompanyDTO instance of the newly created company
     */
    createCompany = async (createCompanyDTO: CreateCompanyDTO): Promise<CompanyDTO> => {
        const companyName = createCompanyDTO.name?.trim();
        const companyExists = await this.companyRepo.doesCompanyExists(companyName);
        if (companyExists) {
            throw new ConflictError('A company with the selected name already exists');
        }
        const categories = (await this.categoryRepo.findAllCategories()).map((c) => createCategoryDTO(c));
        var check = true;
        createCompanyDTO.categories.forEach(category => {
            if (categories.includes(category)) {
            } else {
                check = false;
            }
        });
        if (!check) {
            throw new BadRequestError('A category inserted is not present on the list of existing categories');
        }
        const newComp = {} as CompanyDAO;
        const categoryDAOs = [] as CategoryDAO[];
        for (const id of createCompanyDTO.categories) {
            if (typeof id !== 'number' || Number.isNaN(id) || id < 0) {
                throw new BadRequestError(`Invalid category id: ${id}`);
            }
            const cat = await this.categoryRepo.findCategoryById(id);
            if (!cat) throw new NotFoundError(`Category ${id} not found`);
            categoryDAOs.push(cat);
        }
        newComp.categories = categoryDAOs;
        newComp.name = companyName;
        const saved = await this.companyRepo.createNewCompany(newComp);
        return mapCompanyDAOtoDTO(saved);
    };

    /**
     * function to retrieve all the existing companies
     * @returns CompanyDTO[], array containing all the Companies (as CompanyDTO)
     */
    getAllCompanies = async(): Promise<CompanyDTO[]> => {
        const companies = await this.companyRepo.findAllCompanies();
        return companies.map(c => mapCompanyDAOtoDTO(c));
    }
}   

export const companyService = new CompanyService();