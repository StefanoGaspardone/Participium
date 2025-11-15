import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { UserDAO } from "@daos/UserDAO";
import * as bcrypt from "bcryptjs";

export class UserRepository {
  private repo: Repository<UserDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserDAO);
  }

  findAllUsers = async (): Promise<UserDAO[]> => {
    return this.repo.find({ relations: ["office"] });
  };

  findUserByTelegramUsername = async (telegramUsername: string): Promise<UserDAO | null> => {
    return this.repo.findOne({ where: { telegramUsername } });
  }

  createNewUser = async (user: UserDAO): Promise<UserDAO> => {
    return this.repo.save(user);
  };

  login = async (username: string, password: string): Promise<UserDAO | null> => {
    const user = await this.repo.findOneBy({ username });
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordValid) return user;
    }
    return null;
  };

  
}

export const userRepository = new UserRepository();
