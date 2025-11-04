import { Request, Response, NextFunction } from 'express';
import {UserService} from "@services/UserService";
import {userService} from "@services/UserService";
import {UserSignUpDTO} from '@dtos/UserDTO';

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
            console.log("inside controller");
            const {payload} = req.body;
            const newUser = await this.userService.signUpUser(payload);
            res.status(201).json({ user: newUser });
        } catch(error) {
            //TODO handle specific errors (e.g., duplicate email)
            next(error);
        }
    }

}

export const userController = new UserController();