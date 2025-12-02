import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/Homepage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import UploadReport from "./components/UploadReportPage";
import "./App.css";
import "./custom_theme.scss";
import AdminHomepage from "./components/AdminHomepage";
import PROHomepage from "./components/PROHomepage";
import TechnicalStaffHomepage from "./components/TechnicalStaffHomepage";
import { useAppContext } from "./contexts/AppContext";
import ProfilePage from "./components/ProfilePage.tsx";
import type { Coord } from "./models/models.ts";
import { Toaster } from "react-hot-toast";
import ConfirmCodePage from "./components/ConfirmCodePage.tsx";

function App() {
  const [selected, setSelected] = useState<Coord | null>(null);

  const { user, isLoggedIn } = useAppContext();

  useEffect(() => {
    if (!user) setSelected(null);
  }, [user]);

  return (
    <>
      <Toaster
        position="top-center"
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
        <Route
          path="/"
          element={
            !isLoggedIn || (isLoggedIn && user?.userType === 'CITIZEN') ? (
              <HomePage selected={selected} setSelected={setSelected} />
            ) : user?.userType === 'ADMINISTRATOR' ? (
              <Navigate to="/admin" />
            ) : user?.userType === 'PUBLIC_RELATIONS_OFFICER' ? (
              <Navigate to="/pro" />
            ) : user?.userType === 'TECHNICAL_STAFF_MEMBER' && (
              <Navigate to="/tech" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isLoggedIn ? (
              user?.userType === 'ADMINISTRATOR' && (
                <AdminHomepage />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/pro"
          element={
            isLoggedIn ? (
              user?.userType === 'PUBLIC_RELATIONS_OFFICER' && (
                <PROHomepage />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/tech"
          element={
            isLoggedIn ? (
              user?.userType === 'TECHNICAL_STAFF_MEMBER' && (
                <TechnicalStaffHomepage />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        {/* Aggiungi qui altre rotte, es. /profile */}
        <Route
          path="/reports/new"
          element={
            isLoggedIn ? (
              user?.userType === 'CITIZEN' && (
                <UploadReport selected={selected} setSelected={setSelected} />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? (
              user?.userType === 'CITIZEN' && (
                <ProfilePage />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path = '/confirm-code' element = { user ? <Navigate to = '/'/> : <ConfirmCodePage/> }/>
      </Routes>
    </>
  );
}

export default App;
