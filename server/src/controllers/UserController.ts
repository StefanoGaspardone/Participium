import { NextFunction, Request, Response } from "express";
import { UserService, userService } from "@services/UserService";
import { NewMunicipalityUserDTO, NewUserDTO, MapUserDAOtoDTO } from "@dtos/UserDTO";
import * as jwt from "jsonwebtoken";
import { CONFIG } from "@config";
import { BadRequestError } from "@errors/BadRequestError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { ConflictError } from "@errors/ConflictError";
import { QueryFailedError } from "typeorm";
import { UserType } from "@daos/UserDAO";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "@middlewares/authenticationMiddleware";

interface UserPayload extends JwtPayload {
  userId: number;
  role: UserType;
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = userService;
  }

  findAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.findAllUsers();
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  };

  signUpUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        !req.body.email ||
        !req.body.password ||
        !req.body.firstName ||
        !req.body.lastName ||
        !req.body.username
      ) {
        throw new BadRequestError(
          "Missing one or more required fields: email, password, firstName, lastName, username"
        );
      }
      const payload = {} as NewUserDTO;
      payload.email = req.body.email;
      payload.password = req.body.password;
      payload.firstName = req.body.firstName;
      payload.lastName = req.body.lastName;
      payload.username = req.body.username;
      payload.image = req.body.image;
      payload.telegramUsername = req.body.telegramUsername;
      const newUser = await this.userService.signUpUser(payload);
      res.status(201).json({ message: "User created" });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === "23505"
      ) {
        return next(new ConflictError("Email or username already exists"));
      }
      next(error);
    }
  };

  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.username || !req.body.password) {
        throw new BadRequestError("Username and password are required");
      }
      const user = await this.userService.login(
        req.body.username,
        req.body.password
      );
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      } else {
        const userDto = MapUserDAOtoDTO(user);
        // include full user object inside token under `user` key
        const payload = { user: userDto } as any;
        const token = jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Login successful", token });
      }
    } catch (error) {
      next(error);
    }
  };

  createMunicipalityUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log(req.body);

      if (
        !req.body.email ||
        !req.body.password ||
        !req.body.firstName ||
        !req.body.lastName ||
        !req.body.username ||
        !req.body.userType
      ) {
        throw new BadRequestError(
          "Missing one or more required fields: email, password, firstName, lastName, username, userType"
        );
      }
      if (
        req.body.userType == UserType.TECHNICAL_STAFF_MEMBER &&
        !req.body.officeId
      ) {
        throw new BadRequestError("Missing office id");
      }
      if (!Object.values(UserType).includes(req.body.userType)) {
        throw new BadRequestError("User type is invalid");
      }
      const payload = {} as NewMunicipalityUserDTO;
      payload.email = req.body.email;
      payload.password = req.body.password;
      payload.firstName = req.body.firstName;
      payload.lastName = req.body.lastName;
      payload.username = req.body.username;
      payload.userType = req.body.userType;
      payload.officeId = req.body.officeId;
      const user = await this.userService.createMunicipalityUser(req.body);
      res.status(201).json({ message: "Municipality user created" });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === "23505"
      ) {
        return next(new ConflictError("Email or username already exists"));
      }
      next(error);
    }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.token) throw new UnauthorizedError('Not authenticated');

      // If middleware provided decoded payload under req.token, prefer it.
      // If it contains a `user` object, use that. Otherwise, fetch from DB.
      const decodedAny = req.token as any;

      let userDto = decodedAny?.user || null;

      if (!userDto) throw new UnauthorizedError('User not found');

      const authHeader = req.headers.authorization;
      const rawToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : undefined;

      const token = rawToken ?? jwt.sign({ user: userDto } as any, CONFIG.JWT_SECRET, { expiresIn: '1h' });

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      next(error);
    }
  }
}

interface tokenDatas extends JwtPayload {
  userId: number,
  role: string
}

export const userController = new UserController();
