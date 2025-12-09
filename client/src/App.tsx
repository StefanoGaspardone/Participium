import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import type { Coord, User } from "./models/models.ts";
import { useAppContext } from "./contexts/AppContext";
import AdminHomepage from "./components/AdminHomepage.tsx";
import PROHomepage from "./components/PROHomepage.tsx";
import TechnicalStaffHomepage from "./components/TechnicalStaffHomepage.tsx";
import LoginPage from "./components/LoginPage.tsx";
import RegisterPage from "./components/RegisterPage.tsx";
import ProfilePage from "./components/ProfilePage.tsx";
import ConfirmCodePage from "./components/ConfirmCodePage.tsx";
import ExternalPage from "./components/ExternalPage.tsx";
import HomePage from "./components/Homepage.tsx";
import UploadReport from "./components/UploadReportPage.tsx";

const getHomePathForUser = (user: User | null | undefined): string => {
    if(!user) return "/";

    switch(user.userType) {
        case 'ADMINISTRATOR':
            return "/admin";
        case 'PUBLIC_RELATIONS_OFFICER':
            return "/pro";
        case 'TECHNICAL_STAFF_MEMBER':
            return "/tech";
        case 'EXTERNAL_MAINTAINER':
            return "/external";
        case 'CITIZEN':
        default:
            return "/";
    }
};

const AuthGuard: React.FC<{ allowedUserType: User['userType'] | User['userType'][]; children: React.ReactNode; redirectPath?: string; }> = ({ allowedUserType, children, redirectPath = "/" }) => {
    const { user, isLoggedIn } = useAppContext();
    const allowedTypes = Array.isArray(allowedUserType) ? allowedUserType : [allowedUserType];

    if(!isLoggedIn) {
        return <Navigate to = { redirectPath } replace/>;
    }

    if(user && allowedTypes.includes(user.userType)) {
        return (
            <>
                {children}
            </>
        );
    }
    
    return <Navigate to = { getHomePathForUser(user) } replace/>;
};

function App() {
    const [selected, setSelected] = useState<Coord | null>(null);
    const { user, isLoggedIn } = useAppContext();

    useEffect(() => {
        if(!user) setSelected(null);
    }, [user]);

    const homeElement = isLoggedIn && user?.userType !== 'CITIZEN' ? <Navigate to = { getHomePathForUser(user) } replace/> : <HomePage selected = { selected } setSelected = { setSelected }/>;

    return (
        <>
            <Toaster
        position="top-center"
        containerStyle={{
          zIndex: 99999
        }}
        toastOptions={{
          style: { fontSize: '1.2rem', borderRadius: '11px' },
          className: 'e2e-toast',
          success: {
            iconTheme: { primary: '#265ea8', secondary: '#fff' },
            className: 'e2e-toast e2e-toast-success'
          },
          error: {
            iconTheme: { primary: '#c62828', secondary: '#fff' },
            className: 'e2e-toast e2e-toast-error'
          }
        }}
      />
            <Routes>
                <Route path = "/" element = { homeElement }/>
                <Route path = "/login" element = { <LoginPage/> }/>
                <Route path = "/register" element = { <RegisterPage/>}/>
                <Route path = '/confirm-code' element = { user ? <Navigate to = '/' replace/> : <ConfirmCodePage/> }/>
                <Route path = "/admin" element = {
                    <AuthGuard allowedUserType = 'ADMINISTRATOR'>
                        <AdminHomepage/>
                    </AuthGuard>
                }/>
                <Route path = "/pro" element = {
                    <AuthGuard allowedUserType = 'PUBLIC_RELATIONS_OFFICER'>
                        <PROHomepage/>
                    </AuthGuard>
                }/>
                <Route path = "/tech" element = {
                    <AuthGuard allowedUserType='TECHNICAL_STAFF_MEMBER'>
                        <TechnicalStaffHomepage/>
                    </AuthGuard>
                }/>
                <Route path = "/external" element = {
                    <AuthGuard allowedUserType = 'EXTERNAL_MAINTAINER'>
                        <ExternalPage/>
                    </AuthGuard>
                }/>
                <Route path = "/reports/new" element = {
                    <AuthGuard allowedUserType = 'CITIZEN'>
                        <UploadReport selected = { selected } setSelected = { setSelected }/>
                    </AuthGuard>
                }/>
                <Route path = "/profile" element = {
                    <AuthGuard allowedUserType = 'CITIZEN'>
                        <ProfilePage/>
                    </AuthGuard>
                }/>
            </Routes>
        </>
    );
}

export default App;
