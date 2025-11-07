import {userRepository, UserRepository} from "@repositories/UserRepository";
import {UserDTO, NewUserDTO, MapUserDAOtoDTO, NewMunicipalityUserDTO} from "@dtos/UserDTO";
import {UserDAO, UserType} from "@daos/UserDAO";
import * as bcrypt from "bcryptjs";
import {municipalityRoleRepository, MunicipalityRoleRepository} from "@repositories/MunicipalityRoleRepository";
import {BadRequestError} from "@errors/BadRequestError";

export class UserService {

    private userRepo: UserRepository;
    private municipalityRoleRepo: MunicipalityRoleRepository;

    constructor() {
        this.userRepo = userRepository;
        this.municipalityRoleRepo = municipalityRoleRepository;
    }

    findAllUsers = async (): Promise<UserDTO[]> => {
        const users = await this.userRepo.findAllUsers();
        return users.map(MapUserDAOtoDTO);
    }

    signUpUser = async (payload: NewUserDTO): Promise<UserDAO> => {
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
            return this.userRepo.createNewUser(user);
        } catch (error) {
            throw error;
        }
    }

    login = async (email: string, password: string): Promise<UserDAO | null> => {
        try {
            return this.userRepo.login(email, password);
        }catch (error) {
            throw error;
        }
    }

    createMunicipalityUser = async (payload: NewMunicipalityUserDTO): Promise<UserDAO> => {
        try {
            const user = new UserDAO();
            user.firstName = payload.firstName;
            user.lastName = payload.lastName;
            user.email = payload.email;
            user.username = payload.username;
            user.userType = UserType.OFFICER;
            user.image = payload.image;
            user.telegramUsername = payload.telegramUsername;

            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(payload.password, salt);

            const munRole = await this.municipalityRoleRepo.findRoleById(payload.municipalityRoleId);

            if(!munRole) {
                throw new BadRequestError("Invalid municipality role");
            }
            user.municipalityRole = munRole;
            return this.userRepo.createNewUser(user);
        }catch (error) {
            throw error;
        }
    }
}

export const userService = new UserService();