import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
    userId: number;
    role: string;
    exp: number;
    iat: number;
}

interface UserData {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    image?: string;
    telegramUsername?: string;
    role: string;
    category?: string;
}

export function useAuth() {
    const [user, setUser] = useState<UserData | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const loadUserFromToken = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setIsAuthenticated(false);
            return;
        }

        try {
            const decoded = jwtDecode<TokenPayload>(token);
            const now = Date.now() / 1000;

            if (decoded.exp < now) {
                // token scaduto
                localStorage.removeItem("token");
                setUser(null);
                setIsAuthenticated(false);
                return;
            }

            // Dati base dal token
            const baseUser: UserData = {
                id: decoded.userId,
                role: decoded.role,
            };

            setUser(baseUser);
            setIsAuthenticated(true);
        } catch (err) {
            console.error("Invalid token:", err);
            localStorage.removeItem("token");
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        loadUserFromToken();
    }, [loadUserFromToken]);

    return { user, isAuthenticated, reloadAuth: loadUserFromToken };
}
