import { Router } from 'express';
import {officeController} from "@controllers/OfficeController";

const router = Router();

router.get('/', officeController.findAllOffices);
export const officeRouter = router;