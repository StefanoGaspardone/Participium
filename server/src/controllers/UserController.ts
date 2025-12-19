import { NextFunction, Request, Response } from "express";
import { UserService, userService } from "@services/UserService";
import { NewMunicipalityUserDTO, NewUserDTO, MapUserDAOtoDTO, ValidateUserDTO } from "@dtos/UserDTO";
import * as jwt from "jsonwebtoken";
import { CONFIG } from "@config";
import { BadRequestError } from "@errors/BadRequestError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { ConflictError } from "@errors/ConflictError";
import { QueryFailedError } from "typeorm";
import { UserType } from "@daos/UserDAO";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest, UpdateUserRequest } from "@middlewares/authenticationMiddleware";

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

      if (!telegramUsername.startsWith('@') || telegramUsername.length < 2) throw new BadRequestError(`${telegramUsername} is not a valid telegram username`);

      const user = await this.userService.findUserByTelegramUsername(telegramUsername);
      res.status(200).json({ user });
    } catch (error) {
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
        if (req.body.telegramUsername === '') return next(new ConflictError("Email or username already exists"));
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
        if(CONFIG.JWT_SECRET === undefined) {
          throw new Error("CONFIG ERROR : JWT secret is not correctly set");
        }
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
          (!req.body.officeIds || !Array.isArray(req.body.officeIds) || req.body.officeIds.length === 0)
      ) {
        throw new BadRequestError("Missing office ids array or it's empty");
      }
      if (
          req.body.userType == UserType.EXTERNAL_MAINTAINER &&
          !req.body.companyId
      ) {
          throw new BadRequestError("Missing company id");
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
      payload.officeIds = req.body.officeIds;
      payload.companyId = req.body.companyId;
      const user = await this.userService.createMunicipalityUser(payload);
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
        if (!req.token?.user?.id) throw new UnauthorizedError('Not authenticated or user not found');
        const userId = req.token.user.id;
        // check that in the requst body there are only fields that can be updated
        for (const key in req.body) {
            if (!Object.values(["firstName", "lastName", "username", "email", "image", "telegramUsername", "emailNotificationsEnabled"]).includes(key)) {
                throw new BadRequestError(`Field ${key} cannot be updated.`);
            }
            if (req.body[key] === '') {
                throw new BadRequestError(`Field ${key} cannot be empty.`);
            }
        }
        const fieldsToUpdate = [
          'firstName',
          'lastName',
          'username',
          'email',
          'image',
          'telegramUsername',
          'emailNotificationsEnabled'
        ] as const;
        const updateData: Partial<NewUserDTO> = {};
        for (const field of fieldsToUpdate) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        const user = await this.userService.updateUser(userId, updateData);
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        if (error instanceof QueryFailedError && (error as any).code === "23505") {
            return next(new ConflictError("Email, username or telegram username already exists"));
        }
        next(error);
    }
  };


  findMaintainersByCategory = async (req: Request<{}, {}, {}, { categoryId: string }>, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.query;
      if (!categoryId) throw new BadRequestError('categoryId query parameter is required');
      const id = parseInt(req.query.categoryId, 10);
      if (isNaN(id)) throw new BadRequestError('Id must be a valid number');
      const maintainers = await this.userService.findMaintainersByCategory(id);
      res.status(200).json(maintainers);
    } catch (error) {
      next(error);
    }
  };

  validateUser = async (req: Request<{}, {}, { payload: ValidateUserDTO }>, res: Response, next: NextFunction) => {
    try {
      const { payload } = req.body;

      if (!payload) throw new BadRequestError('Payload is missing');
      if (!payload.username || !payload.username.trim()) throw new BadRequestError('Property \'username\' is missing or invalid');
      if (!payload.code || !payload.code.trim()) throw new BadRequestError('Property \'code\' is missing or invalid');

      await this.userService.validateUser(payload.username, payload.code);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  resendCode = async (req: Request<{}, {}, { username: string }>, res: Response, next: NextFunction) => {
    try {
      const { username } = req.body;

      if (!username || !username.trim()) throw new BadRequestError('Property \'username\' is missing or invalid');

      await this.userService.resendCode(username);
      return res.status(201).send();
    } catch (error) {
      next(error);
    }
  }

  findTsm = async(req: Request, res: Response, next: NextFunction) => {
    try {
      const tsm = await this.userService.findTechnicalStaffMembers();
        res.status(200).json({ tsm });
    }catch (error) {
        next(error);
    }
  }

  updateTsm = async(req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const tsmId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(tsmId)) throw new BadRequestError('Id must be a valid number');

      if(!req.body.officeIds || !Array.isArray(req.body.officeIds) || req.body.officeIds.length === 0) {
        throw new BadRequestError('officeIds must be a not empty array of numbers');
      }

      const updatedTsm = await this.userService.updateTsm(tsmId, req.body.officeIds);
      res.status(200).json({ message: "TSM availability updated successfully", updatedTsm });
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
