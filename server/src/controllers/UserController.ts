import { NextFunction, Request, Response } from "express";
import { UserService, userService } from "@services/UserService";
import { NewMunicipalityUserDTO, NewUserDTO } from "@dtos/UserDTO";
import * as jwt from "jsonwebtoken";
import { CONFIG } from "@config";
import { BadRequestError } from "@errors/BadRequestError";
import { ConflictError } from "@errors/ConflictError";
import { QueryFailedError } from "typeorm";
import { UserType } from "@daos/UserDAO";
import { JwtPayload } from "jsonwebtoken";

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
      if (!req.body.email || !req.body.password) {
        throw new BadRequestError("Email and password are required");
      }
      const user = await this.userService.login(
        req.body.email,
        req.body.password
      );
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      } else {
        const payload = { userId: user.id, role: user.userType };
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
      payload.image = req.body.image;
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

  refreshUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.token) {
        throw new BadRequestError("User not logged");
      }
      // if we arrive here, the user is logged as authmiddleware already checked it

      //******** */
      const userPayload: tokenDatas = jwt.decode(req.body.token) as tokenDatas;
      //***** */
      res.status(200).json({ userId: userPayload.userId, role: userPayload.role });
    } catch (error) {
      next(error);
    }
  };
}

interface tokenDatas extends JwtPayload {
  userId: number,
  role: string
}

export const userController = new UserController();
