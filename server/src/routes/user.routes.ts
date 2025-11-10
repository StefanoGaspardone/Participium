import { Router } from 'express';
import {userController} from "@controllers/UserController";
import {authMiddleware} from "@middlewares/authenticationMiddleware";
import {UserType} from "@daos/UserDAO";
const router = Router();

router.get('/', userController.findAllUsers); //TODO remove or protect in production
router.post('/signup', userController.signUpUser);
router.post('/login', userController.loginUser);
router.post('/employees', authMiddleware([UserType.ADMINISTRATOR]),  userController.createMunicipalityUser);
router.post('/refreshUser', authMiddleware([UserType.CITIZEN, UserType.ADMINISTRATOR]), userController.refreshUser);

export const userRouter = router;