import {NextFunction, Request, Response} from "express";
import * as jwt from "jsonwebtoken";
import {JwtPayload} from "jsonwebtoken";
import {UserType} from "@daos/UserDAO";
import {jwtSecret} from "@app";
import {UnauthorizedError} from "@errors/UnauthorizedError";
import {InsufficientRightsError} from "@errors/InsufficientRightsError";

// Definisci la struttura del tuo payload
interface UserPayload extends JwtPayload {
    userId: number;
    role: UserType;
}

// Estendi l'interfaccia Request per includere il payload dell'utente
interface AuthRequest extends Request {
    token?: string | jwt.JwtPayload;
}

export const authMiddleware = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Denied access. Please insert token.");
        }

        const token = authHeader.split(" ")[1];
        try {
            // Verifica il token
            req.token = jwt.verify(token, jwtSecret) as UserPayload; // to add fields to request if needed
            const userRole = req.token.role;
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
