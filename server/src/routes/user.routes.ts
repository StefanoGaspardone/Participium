import { Router } from 'express';
import { userController } from "@controllers/UserController";
import { authMiddleware } from "@middlewares/authenticationMiddleware";
import { UserType } from "@daos/UserDAO";
const router = Router();

router.get('/', userController.findAllUsers); //TODO remove or protect in production
router.post('/signup', userController.signUpUser);
router.post('/login', userController.loginUser);
router.post('/employees', authMiddleware([UserType.ADMINISTRATOR]), userController.createMunicipalityUser);
router.post('/me', authMiddleware([
    UserType.CITIZEN,
    UserType.ADMINISTRATOR,
    UserType.MUNICIPAL_ADMINISTRATOR,
    UserType.PUBLIC_RELATIONS_OFFICER,
    UserType.TECHNICAL_STAFF_MEMBER,
    UserType.EXTERNAL_MAINTAINER]), userController.me);
router.get('/maintainers', userController.findMaintainersByCategory);
router.patch('/me', authMiddleware([UserType.CITIZEN]), userController.updateUser);
router.post('/validate-user', userController.validateUser);
router.post('/resend-user', userController.resendCode);
router.get("/tsm", authMiddleware([UserType.ADMINISTRATOR]) , userController.findTsm);
router.patch("/tsm/:id", authMiddleware([UserType.ADMINISTRATOR]) , userController.updateTsm);

router.get('/:telegramUsername', userController.findUserByTelegramUsername)
export const userRouter = router;