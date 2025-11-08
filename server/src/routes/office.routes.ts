import { authMiddleware } from '@middlewares/authenticationMiddleware';
import { Router } from 'express';
import {officeController} from "@controllers/OfficeController";

const router = Router();

router.get('/', officeController.findAllOffices); //TODO add authMiddleware if needed

export const officeRouter = router;