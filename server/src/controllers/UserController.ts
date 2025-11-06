import {NextFunction, Request, Response} from 'express';
import {UserService, userService} from "@services/UserService";
import {UserSignUpDTO} from '@dtos/UserDTO';
import * as jwt from "jsonwebtoken";
import {jwtSecret} from "@app";
import {BadRequestError} from "@errors/BadRequestError";
import {ConflictError} from "@errors/ConflictError";
import {QueryFailedError} from "typeorm";

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

    signUpUser =async (req: Request, res: Response, next: NextFunction) => {
        try {
            if(!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName || !req.body.username) {
                throw new BadRequestError("Missing one or more required fields: email, password, firstName, lastName, username");
            }
            const payload = {} as UserSignUpDTO;
            payload.email = req.body.email;
            payload.password = req.body.password;
            payload.firstName = req.body.firstName;
            payload.lastName = req.body.lastName;
            payload.username = req.body.username;
            payload.image = req.body.image;
            payload.telegramUsername = req.body.telegramUsername;
            const newUser = await this.userService.signUpUser(payload);
            res.status(201).json({message: 'User created'});
        } catch(error) {
            if (error instanceof QueryFailedError && (error as any).code === '23505') {
                return next(new ConflictError('Email or username already exists'));
            }
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