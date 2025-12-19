import { UserDAO, UserType } from '@daos/UserDAO';
import {mapCompanyDAOtoDTO} from "@dtos/CompanyDTO";

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
    offices?: string[] | null;
    company?: string | null;
    isActive: boolean;
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
        offices: user.offices? user.offices.map(o => o.name) : null,
        company: user.company? mapCompanyDAOtoDTO(user.company) : null,
        createdAt: new Date(user.createdAt),
        isActive: user.isActive,
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
    officeIds?: number[];
    companyId?: number;
    image?: string;
}

export interface ValidateUserDTO {
    username: string;
    code: string;
}