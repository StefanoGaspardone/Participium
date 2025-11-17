import {NextFunction, Request, Response} from "express";
import * as jwt from "jsonwebtoken";
import {JwtPayload} from "jsonwebtoken";
import {UserType} from "@daos/UserDAO";
import {jwtSecret} from "@app";
import {UnauthorizedError} from "@errors/UnauthorizedError";
import {InsufficientRightsError} from "@errors/InsufficientRightsError";
import { UserDTO } from "@dtos/UserDTO";

// Definisci la struttura del tuo payload
// Payload can be either legacy { userId, role } or new { user }
interface UserPayload extends JwtPayload {
    user?: UserDTO;
}

// Estendi l'interfaccia Request per includere il payload dell'utente
export interface AuthRequest extends Request {
    token?: UserPayload;
}

export interface UpdateUserRequest extends Request {
    params: {
        id: string;
    };
    token?: UserPayload;
}

export const authMiddleware = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Denied access. Please insert token.");
        }

        const token = authHeader.split(" ")[1];
        try {
            // Verify token and attach payload. Support tokens that contain
            // either `{ userId, role }` (legacy) or `{ user: { ... } }`.
            const decoded = jwt.verify(token, jwtSecret) as UserPayload;
            req.token = decoded;

            const userRole = decoded.user?.userType;
            if (userRole && !allowedRoles.includes(userRole)) {
                throw new InsufficientRightsError("Denied access. Insufficient permissions.");
            }

            next(); // Passa al controller successivo
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError("Denied access. Invalid token.");
            }
            next(error)
        }
    };
};
