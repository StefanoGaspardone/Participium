import { Router } from 'express';
import {userController} from "@controllers/UserController";

const router = Router();

router.get('/', userController.findAllUsers);
router.post('/signup', userController.signUpUser);

export const userRouter = router;