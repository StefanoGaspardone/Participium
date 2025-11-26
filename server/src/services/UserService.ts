import {userRepository, UserRepository} from "@repositories/UserRepository";
import {MapUserDAOtoDTO, NewMunicipalityUserDTO, NewUserDTO, UserDTO} from "@dtos/UserDTO";
import {UserDAO, UserType} from "@daos/UserDAO";
import * as bcrypt from "bcryptjs";
import {officeRepository, OfficeRepository} from "@repositories/OfficeRepository";
import {BadRequestError} from "@errors/BadRequestError";
import {NotFoundError} from "@errors/NotFoundError";

export class UserService {

    private userRepo: UserRepository;
    private officeRepo: OfficeRepository;

    constructor() {
        this.userRepo = userRepository;
        this.officeRepo = officeRepository;
    }

    findAllUsers = async (): Promise<UserDTO[]> => {
        const users = await this.userRepo.findAllUsers();
        return users.map(MapUserDAOtoDTO);
    }

    findUserByTelegramUsername = async (telegramUsername: string): Promise<UserDTO> => {
        const user = await this.userRepo.findUserByTelegramUsername(telegramUsername);

        if(!user) throw new NotFoundError(`No user found with telegram username ${telegramUsername}`);
        return MapUserDAOtoDTO(user);
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
        user.emailNotificationsEnabled = payload.emailNotificationsEnabled;
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(payload.password, salt);

        try {
            return this.userRepo.createNewUser(user);
        } catch (error) {
            throw error;
        }
    }

    login = async (username: string, password: string): Promise<UserDAO | null> => {
        try {
            return this.userRepo.login(username, password);
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
            user.userType = payload.userType;
            if(payload.userType == UserType.TECHNICAL_STAFF_MEMBER && payload.officeId){
                const office = await this.officeRepo.findOfficeById(payload.officeId);
                if(!office){
                    throw new BadRequestError("office not found.");
                }
                user.office = office;
            }else if(payload.userType == UserType.MUNICIPAL_ADMINISTRATOR || payload.userType == UserType.PUBLIC_RELATIONS_OFFICER){
                const office = await this.officeRepo.findOrganizationOffice();
                console.log(office);
                if(!office){
                    throw new BadRequestError("Organization office not found.");
                }
                user.office = office;
            }
            user.image = payload.image;

            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(payload.password, salt);

            return this.userRepo.createNewUser(user);
        }catch (error) {
            throw error;
        }
    }

    updateUser = async (id: number, updateData: Partial<UserDAO>): Promise<UserDTO> => {
        const user = await this.userRepo.findUserById(id);
        if(!user) throw new NotFoundError(`User with id ${id} not found`);

        if(updateData.firstName !== undefined) user.firstName = updateData.firstName;
        if(updateData.lastName !== undefined) user.lastName = updateData.lastName;
        if(updateData.email !== undefined) user.email = updateData.email;
        if(updateData.username !== undefined) user.username = updateData.username;
        if(updateData.image !== undefined) user.image = updateData.image;
        if(updateData.telegramUsername !== undefined) user.telegramUsername = updateData.telegramUsername;
        if(updateData.emailNotificationsEnabled !== undefined) user.emailNotificationsEnabled = updateData.emailNotificationsEnabled;
        const updatedUser = await this.userRepo.updateUser(user);
        return MapUserDAOtoDTO(updatedUser);
    }
}


export const userService = new UserService();