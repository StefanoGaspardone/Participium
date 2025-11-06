import { UserDAO, UserType } from '@daos/UserDAO';
import {
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    MinLength,
    ValidateIf
} from 'class-validator';

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
        municipalityRole: user.municipalityRole? user.municipalityRole.name : null,
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
}

export interface NewMunicipalityUserDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    municipalityRole: string;
    image?: string;
    telegramUsername?: string;
}