import { Router } from 'express';
import {userController} from "@controllers/UserController";
import {authMiddleware} from "@middlewares/authenticationMiddleware";
import {UserType} from "@daos/UserDAO";
const router = Router();

router.get('/', userController.findAllUsers); //TODO remove or protect in production
router.post('/signup', userController.signUpUser);
router.post('/login', userController.loginUser);
//router.get('/createMunicipalityUser', authMiddleware([UserType.ADMINISTRATOR]),  userController.);

export const userRouter = router;