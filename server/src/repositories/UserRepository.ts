import { AppDataSource } from '@database';
import { Repository } from 'typeorm';
import {UserDAO} from "@daos/UserDAO";

export class UserRepository {

    private repo: Repository<UserDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(UserDAO);
    }

    findAllUsers = async (): Promise<UserDAO[]> => {
        return this.repo.find();
    }

    signUpUser = async (user: UserDAO): Promise<UserDAO> => {
        return this.repo.save(user);
    }
}

export const userRepository = new UserRepository();