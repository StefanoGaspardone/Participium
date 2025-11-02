import { UserDTO } from '@dtos/UserDTO';

declare global {
    namespace Express {
        interface Request {
            user?: UserDTO;
        }
    }
}

export {};