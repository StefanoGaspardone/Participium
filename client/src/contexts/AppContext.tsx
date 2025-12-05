import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../models/models";
import { jwtDecode } from "jwt-decode";
import { me as meApi } from "../api/api";
import { useLocation, useNavigate } from "react-router-dom";

type TokenPayload = {
    user: User;
    exp?: number;
    iat?: number;
};

type AppContextValue = {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    setUserFromToken: (token: string | null) => Promise<void>;
    isLoggedIn: boolean;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

interface PropsInterface {
    children: ReactNode
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: PropsInterface) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    const navigate = useNavigate();

    const setUserFromToken = async (token: string | null) => {
        console.log('token: ', token);

        if(!token) {
            localStorage.removeItem("token");
            setUser(null);
            setIsLoggedIn(false);

            return;
        }

        try {
            localStorage.setItem("token", token);

            const decoded = jwtDecode<TokenPayload>(token);

            if(decoded.exp && decoded.exp < Date.now() / 1000) {
                localStorage.removeItem("token");
                setUser(null);
                setIsLoggedIn(false);

                return;
            }

            console.log('decoded: ', decoded);
            setUser(decoded.user);
            setIsLoggedIn(true);
        } catch(err) {
            console.error("Failed to set user from token", err);
            localStorage.removeItem("token");
            setUser(null);
        }
    };

    let first = true;
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await meApi();
                if(res?.token) {
                    await setUserFromToken(res.token);
                } else {
                    setUser(null);
                    setIsLoggedIn(false);

                    navigate('/');
                }
            } catch {
                setUser(null);
            }
        };

        if(first) {
            fetchUser();
            first = false;
        }
    }, []);

    const loc = useLocation();

    useEffect(() => {
        if(loc.pathname === '/profile') {navigate('/profile'); return;}
        if(user?.userType === 'CITIZEN') navigate('/');
        else if(user?.userType === 'ADMINISTRATOR') navigate('/admin');
        else if(user?.userType === 'PUBLIC_RELATIONS_OFFICER') navigate('/pro');
        else if(user?.userType === 'TECHNICAL_STAFF_MEMBER') navigate('/tech');
        else if(user?.userType === 'EXTERNAL_MAINTAINER') navigate('/external');
    }, [user]);

    return (
        <AppContext.Provider value = {{ user, setUser, setUserFromToken, isLoggedIn, setIsLoggedIn }}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = (): AppContextValue => {
    const ctx = useContext(AppContext);
    if(!ctx) throw new Error('useAppContext must be used within an AppProvider');
    return ctx;
};