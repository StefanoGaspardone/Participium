import { CompanyController, companyController } from "@controllers/CompanyController";
import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';
import { UserType } from '@daos/UserDAO';


const router = Router();

// in api/api.ts :
// createCompany(payload: Company) 
//      Company = { id: number, name: string, categories: Category[] } 
//          Category = { id: number, name: string; }
router.get('/', authMiddleware([UserType.ADMINISTRATOR, UserType.PUBLIC_RELATIONS_OFFICER]), companyController.getAllCompanies);

// in api/api.ts :
// getAllCompanies()
router.post('/', authMiddleware([UserType.ADMINISTRATOR]), companyController.createCompany);

export const companyRouter = router;