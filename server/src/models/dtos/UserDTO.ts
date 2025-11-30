import { UserDAO, UserType } from '@daos/UserDAO';

export interface UserDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    image?: string | null;
    telegramUsername?: string | null;
    userType: string;
    emailNotificationsEnabled?: boolean;
    office?: string | null;
    createdAt: Date;
}

export const MapUserDAOtoDTO = (user: UserDAO): UserDTO => {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        image: user.image,
        telegramUsername: user.telegramUsername,
        userType: user.userType,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        office: user.office? user.office.name : null,
        createdAt: new Date(user.createdAt),
        passwordHash: user.passwordHash
    } as UserDTO;
}

export interface NewUserDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    image?: string;
    telegramUsername?: string;
    emailNotificationsEnabled: boolean;
}

export interface NewMunicipalityUserDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    userType: UserType;
    officeId?: number;
    image?: string;
}

export interface ValidateUserDTO {
    username: string;
    code: string;
}