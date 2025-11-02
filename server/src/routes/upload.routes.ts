import { uploadController } from "@controllers/UploadController";
import { Router } from "express";

const router = Router();

router.post('/sign', uploadController.sign);

export const uploadRouter = router;