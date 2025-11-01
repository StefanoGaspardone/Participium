import { UserDAO, UserType } from "@daos/UserDAO";

export interface UserDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    image?: string | null;
    telegramUsername?: string | null;
    userType: UserType;
    municipalityRole?: string | null;
    createdAt: Date;
}

export const createUserDTO = (user: UserDAO): UserDTO => {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        image: user.image,
        telegramUsername: user.telegramUsername,
        userType: user.userType,
        municipalityRole: user.municipalityRole.name,
        createdAt: new Date(user.createdAt),
    } as UserDTO;
}