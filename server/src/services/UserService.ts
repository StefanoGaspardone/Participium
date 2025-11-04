import {userRepository, UserRepository} from "@repositories/UserRepository";
import {UserDTO, UserSignUpDTO, CreateUserDTO} from "@dtos/UserDTO";
import {UserDAO, UserType} from "@daos/UserDAO";

export class UserService {

    private userRepo: UserRepository;

    constructor() {
        this.userRepo = userRepository;
    }

    findAllUsers = async (): Promise<UserDTO[]> => {
        const users = await this.userRepo.findAllUsers();
        return users.map(CreateUserDTO);
    }

    signUpUser = async (payload: UserSignUpDTO): Promise<UserDAO> => {
        //TODO validate payload
        console.log("inside service");
        const user = new UserDAO();
        user.firstName = payload.firstName;
        user.lastName = payload.lastName;
        user.email = payload.email;
        user.username = payload.username;
        user.userType = UserType.CITIZEN;
        user.image = payload.image;
        user.telegramUsername = payload.telegramUsername;

        //TODO hash password
        user.passwordHash = payload.password;

        //TODO assign municipalityRole if userType is MUNICIPALITY_MEMBER

        try {
            return this.userRepo.signUpUser(user);
        } catch (error) {
            throw error;
        }


    }
}

export const userService = new UserService();