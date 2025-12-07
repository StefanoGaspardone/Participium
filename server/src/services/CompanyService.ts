import { NotFoundError } from '@errors/NotFoundError';
import { BadRequestError } from '@errors/BadRequestError';
import { categoryRepository, CategoryRepository } from '@repositories/CategoryRepository';
import { CompanyRepository, companyRepository } from '@repositories/CompanyRepository';
import { CreateCompanyDTO, CompanyDTO, mapCompanyDAOtoDTO } from '@dtos/CompanyDTO';
import { ConflictError } from '@errors/ConflictError';
import { CompanyDAO } from '@daos/CompanyDAO';
import { CategoryDAO } from '@daos/CategoryDAO';

export class CompanyService {

    private companyRepo: CompanyRepository;
    private categoryRepo: CategoryRepository;

    constructor() {
        this.companyRepo = companyRepository;
        this.categoryRepo = categoryRepository;
    }

    /**
     * function to create a Company
     * @param createCompanyDTO: CreateCompanyDTO, contains the necessary fields to create a new company
     * { name: string, categories: CategoryDTO[] }
     * @returns a CompanyDTO instance of the newly created company
     */
    createCompany = async (createCompanyDTO: CreateCompanyDTO): Promise<CompanyDTO> => {
        const companyName = createCompanyDTO.name?.trim();
        
        // Validate name before checking for duplicates to ensure correct HTTP status codes
        // Empty/whitespace names should return 400 BadRequest, not 409 Conflict
        if (!companyName || companyName.length === 0) {
            throw new BadRequestError('Company name cannot be empty or whitespace');
        }
        
        // Validate that at least one category is provided
        // Business rule: companies must be associated with at least one category
        if (!createCompanyDTO.categories || createCompanyDTO.categories.length === 0) {
            throw new BadRequestError('Company must have at least one category');
        }
        
        // Check for duplicate company names after validating the input
        const companyExists = await this.companyRepo.doesCompanyExists(companyName);
        if (companyExists) {
            throw new ConflictError('A company with the selected name already exists');
        }
        
        // Validate each category individually by fetching from database
        // Performance optimization: validate categories directly instead of loading all categories first
        const categoryDAOs: CategoryDAO[] = [];
        for (const cat of createCompanyDTO.categories) {
            const id = cat.id;
            if (typeof id !== 'number' || Number.isNaN(id) || id < 0) {
                throw new BadRequestError(`Invalid category id: ${id}`);
            }
            const categoryDAO = await this.categoryRepo.findCategoryById(id);
            if (!categoryDAO) {
                throw new BadRequestError(`A category inserted is not present on the list of existing categories`);
            }
            categoryDAOs.push(categoryDAO);
        }
        
        const newComp: CompanyDAO = {
            name: companyName,
            categories: categoryDAOs
        } as CompanyDAO;
        const saved = await this.companyRepo.createNewCompany(newComp);
        return mapCompanyDAOtoDTO(saved);
    };

    /**
     * function to retrieve all the existing companies
     * @returns CompanyDTO[], array containing all the Companies (as CompanyDTO)
     */
    getAllCompanies = async (): Promise<CompanyDTO[]> => {
        const companies = await this.companyRepo.findAllCompanies();
        return companies.map(c => mapCompanyDAOtoDTO(c));
    }
}

export const companyService = new CompanyService();