import {NextFunction, Request, Response} from 'express';
import {UserService, userService} from "@services/UserService";
import {UserSignUpDTO} from '@dtos/UserDTO';
import * as jwt from "jsonwebtoken";
import {jwtSecret} from "@app";

export class UserController {

    private userService: UserService;

    constructor() {
        this.userService = userService;
    }

    findAllUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await this.userService.findAllUsers();
            res.status(200).json({ users });
        } catch(error) {
            next(error);
        }
    }

    signUpUser =async (req: Request<{}, {}, { payload: UserSignUpDTO }>, res: Response, next: NextFunction) => {
        try {
            const {payload} = req.body;
            const newUser = await this.userService.signUpUser(payload);
            res.status(201).json({ });
        } catch(error) {
            //TODO handle specific errors (e.g., duplicate email)
            next(error);
        }
    }

    loginUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body.email || !req.body.password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            const user = await this.userService.login(req.body.email, req.body.password);
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }else {
                const payload = { userId: user.id, role: user.userType };
                const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
                res.status(200).json({ message: 'Login successful', token });
            }
        } catch(error) {
            next(error);
        }
    }
}

export const userController = new UserController();