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

/**
 * @swagger
 * /users/tsm:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all Technical Staff Members
 *     description: Retrieves a list of all technical staff members with their assigned offices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of technical staff members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tsm:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       firstName:
 *                         type: string
 *                         example: Mario
 *                       lastName:
 *                         type: string
 *                         example: Rossi
 *                       email:
 *                         type: string
 *                         example: mario.rossi@example.com
 *                       username:
 *                         type: string
 *                         example: mrossi
 *                       userType:
 *                         type: string
 *                         example: TECHNICAL_STAFF_MEMBER
 *                       offices:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             name:
 *                               type: string
 *                               example: Technical Office
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not an administrator
 *       500:
 *         description: Internal server error
 */
router.get("/tsm", authMiddleware([UserType.ADMINISTRATOR]) , userController.findTsm);

/**
 * @swagger
 * /users/tsm/{id}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update Technical Staff Member offices
 *     description: Updates the assigned offices for a specific technical staff member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The technical staff member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - officeIds
 *             properties:
 *               officeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *                 description: Array of office IDs to assign to the technical staff member
 *     responses:
 *       200:
 *         description: Technical staff member offices updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: TSM availability updated successfully
 *                 updatedTsm:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     offices:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - Invalid ID or empty officeIds array
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not an administrator
 *       404:
 *         description: Technical staff member not found
 *       500:
 *         description: Internal server error
 */
router.patch("/tsm/:id", authMiddleware([UserType.ADMINISTRATOR]) , userController.updateTsm);

router.get('/:telegramUsername', userController.findUserByTelegramUsername)
export const userRouter = router;