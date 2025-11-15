import { CONFIG } from "@config";
import { NextFunction, Router, Request, Response } from "express";

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.send(`Server running on http://localhost:${CONFIG.APP_PORT}`);
    } catch(error) {
        next(error);
    }
});

export const healthRouter = router;