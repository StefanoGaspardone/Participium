import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';
import {municipalityRoleController} from "@controllers/MunicipalityRoleController";

const router = Router();

router.get('/', municipalityRoleController.findAllRoles); //TODO add authMiddleware if needed

export const municipalityRoleRouter = router;