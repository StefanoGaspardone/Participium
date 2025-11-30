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
import {AuthRequest, UpdateUserRequest} from "@middlewares/authenticationMiddleware";

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

  findUserByTelegramUsername = async (req: Request<{ telegramUsername: string }>, res: Response, next: NextFunction) => {
    try {
      const { telegramUsername } = req.params;

      if(!telegramUsername.startsWith('@') || telegramUsername.length < 2) throw new BadRequestError(`${telegramUsername} is not a valid telegram username`);

      const user = await this.userService.findUserByTelegramUsername(telegramUsername);
      res.status(200).json({ user });
    } catch(error) {
      next(error);
    }
  }

  signUpUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        !req.body.email ||
        !req.body.password ||
        !req.body.firstName ||
        !req.body.lastName ||
        !req.body.username ||
        req.body.emailNotificationsEnabled === undefined // Check for undefined (not !value) to allow false values (citizen not wanting email notifications upon registration)
      ) {
        throw new BadRequestError(
          "Missing one or more required fields: email, password, firstName, lastName, username, emailNotificationsEnabled"
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
      payload.emailNotificationsEnabled = req.body.emailNotificationsEnabled;
      await this.userService.signUpUser(payload);
      
      res.status(201).send();
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === "23505") {
        if(req.body.telegramUsername === '') return next(new ConflictError("Email or username already exists"));
        else return next(new ConflictError("Email, username or telegram username already exists"));
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
        const token = jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: "1d" });
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
      //console.log(req.body);

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

      const token = rawToken ?? jwt.sign({ user: userDto } as any, CONFIG.JWT_SECRET, { expiresIn: '1d' });

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      next(error);
    }
  }

  updateUser = async (req: UpdateUserRequest, res: Response, next: NextFunction) => {
      try {
          if (!req.token) throw new UnauthorizedError('Token is missing, not authenticated');
          const decodedAny = req.token;
          let userDto = decodedAny?.user || null;
          if (!userDto) throw new UnauthorizedError('User not found');
          const userId = userDto.id;

          // check that in the requst body there are only fields that can be updated
          for(const key in req.body){
              if(!Object.values(["firstName", "lastName", "username", "email", "image", "telegramUsername", "emailNotificationsEnabled"]).includes(key)){
                  throw new BadRequestError(`Field ${key} cannot be updated.`);
              }
              if(req.body[key] === ''){
                    throw new BadRequestError(`Field ${key} cannot be empty.`);
              }
          }

          const updateData: Partial<NewUserDTO> = {};
          if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
          if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
          if (req.body.username !== undefined) updateData.username = req.body.username;
          if (req.body.email !== undefined) updateData.email = req.body.email;
          if (req.body.image !== undefined) updateData.image = req.body.image;
          if (req.body.telegramUsername !== undefined) updateData.telegramUsername = req.body.telegramUsername;
          if (req.body.emailNotificationsEnabled !== undefined) updateData.emailNotificationsEnabled = req.body.emailNotificationsEnabled;
          const user = await this.userService.updateUser(userId, updateData);
          res.status(200).json({ message: "User updated successfully" , user});
      } catch (error) {
          if (error instanceof QueryFailedError && (error as any).code === "23505") {
              return next(new ConflictError("Email, username or telegram username already exists"));
          }
          next(error);
      }
  };
}

interface tokenDatas extends JwtPayload {
  userId: number,
  role: string
}

export const userController = new UserController();
