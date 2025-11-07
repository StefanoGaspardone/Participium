import { userRepository, UserRepository } from "@repositories/UserRepository";
import { UserDTO, UserSignUpDTO, CreateUserDTO } from "@dtos/UserDTO";
import { UserDAO, UserType } from "@daos/UserDAO";
import * as bcrypt from "bcryptjs";

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = userRepository;
  }

  findAllUsers = async (): Promise<UserDTO[]> => {
    const users = await this.userRepo.findAllUsers();
    return users.map(CreateUserDTO);
  };

  signUpUser = async (payload: UserSignUpDTO): Promise<UserDAO> => {
    const user = new UserDAO();
    user.firstName = payload.firstName;
    user.lastName = payload.lastName;
    user.email = payload.email;
    user.username = payload.username;
    user.userType = UserType.CITIZEN;
    user.image = payload.image;
    user.telegramUsername = payload.telegramUsername;

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(payload.password, salt);

    try {
      return await this.userRepo.signUpUser(user);
    } catch (error) {
      throw error;
    }
  };

  login = async (email: string, password: string): Promise<UserDAO | null> => {
    try {
      return await this.userRepo.login(email, password);
    } catch (error) {
      throw error;
    }
  };
}

export const userService = new UserService();
