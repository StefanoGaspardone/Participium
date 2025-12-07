import { CategoryDTO } from "@dtos/CategoryDTO";
import { CreateCompanyDTO } from "@dtos/CompanyDTO";
import { BadRequestError } from "@errors/BadRequestError";
import { AuthRequest } from "@middlewares/authenticationMiddleware";
import { CategoryService } from "@services/CategoryService";
import { companyService, CompanyService } from "@services/CompanyService";
import { Response, NextFunction, Request } from 'express';


export class CompanyController {

    private companyService: CompanyService;
    // private categoryService: CategoryService;

    constructor() {
        this.companyService = companyService;
    }

    /**
     * function to create a Company
     * @param req it needs to have 2 properties : req.body.name: string AND req.body.categories: CategoryDTO[]
     * where CategoryDTO : { id: number, name: string }
     * @param res it returns the newly created company: CompanyDTO
     * @param next 
     */
    createCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }
            if (req.body.name === undefined) {
                throw new BadRequestError('A name for the company must be specified');
            }
            const compName = req.body.name;
            if (req.body.categories === undefined) {
                throw new BadRequestError('A set of categories for the company must be specified');
            }
            const categories = req.body.categories;
            const payload = {} as CreateCompanyDTO;
            payload.name = compName;
            const compCategories: CategoryDTO[] = [];
            for (const cat of categories) {
                var catToAdd = {} as CategoryDTO;
                catToAdd.id = cat.id;
                catToAdd.name = cat.name;
                compCategories.push(catToAdd);
            }
            payload.categories = compCategories;
            const company = await this.companyService.createCompany(payload);
            return res.status(201).json(company);
        } catch (error) {
            next(error);
        }
    }

    /**
     * function to retrieve the list of ALL existing companies 
     * @param req 
     * @param res it returns a CompanyDTO[]
     * @param next 
     */
    getAllCompanies = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.token?.user) {
                throw new BadRequestError("Invalid token");
            }
            const companies = await this.companyService.getAllCompanies();
            return res.status(200).json({ companies });
        } catch (error) {
            next(error)
        }
    }
}

export const companyController = new CompanyController();