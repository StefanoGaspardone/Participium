import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/Homepage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import UploadReport from "./components/UploadReportPage";
import "./App.css";
import "./custom_theme.scss";
import AdminHomepage from "./components/AdminHomepage";
import { useAuth } from "./hooks/useAuth";

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

function App() {
  // selected and setSelected are the two parameters (as props) that have to be passed to the Map component
  // selected contains fields "lat" and "lng" and setSelected allow to update their values
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  useAuth(user, setUser);

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              selected={selected}
              setSelected={setSelected}
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              user={user}
              setUser={setUser}
            />
          }
        />
        <Route
          path="/admin"
          element={
            isLoggedIn && user?.role === "ADMINISTRATOR" ? (
              <AdminHomepage
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
                user={user}
                setUser={setUser}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/login"
          element={
            <LoginPage
              setIsLoggedIn={setIsLoggedIn}
              user={user}
              setUser={setUser}
            />
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        {/* Aggiungi qui altre rotte, es. /profile */}
        <Route
          path="/reports/new"
          element={
            isLoggedIn ? (
              <UploadReport
                selected={selected}
                setSelected={setSelected}
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
                user={user}
                setUser={setUser}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
