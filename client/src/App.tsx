import { useState } from "react";
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

function App() {
  // selected and setSelected are the two parameters (as props) that have to be passed to the Map component
  // selected contains fields "lat" and "lng" and setSelected allow to update their values
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const { user, isLoggedIn } = useAppContext();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn || (isLoggedIn && user?.userType === 'CITIZEN') ? (
              <HomePage selected={selected} setSelected={setSelected} />
            ) : user?.userType === 'ADMINISTRATOR' ? (
              <Navigate to="/admin" />
            ) : (
              <Navigate to="/login" />
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
                      <ProfilePage/>
                  )
              ) : (
                  <Navigate to="/"/>
              )
          }
        />
      </Routes>
    </>
  );
}

export default App;
