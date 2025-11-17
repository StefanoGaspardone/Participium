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

  findUserById = async (id: number): Promise<UserDAO | null> => {
    return this.repo.findOne({ where: { id } });
  }

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

    updateUser = async (user: UserDAO): Promise<UserDAO> => {
        await this.repo.update(user.id, user);
        const updatedUser = await this.repo.findOneBy({ id:user.id });
        if (!updatedUser) {
            throw new Error(`User with id ${user.id} not found`);
        }
        console.log(updatedUser);
        return updatedUser;
    }
}

export const userRepository = new UserRepository();
