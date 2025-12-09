import { useState, useEffect, useRef } from "react";
import { Navbar, Container, Image } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useAppContext } from "../contexts/AppContext";
import Notifications from "./Notifications";
import { motion, AnimatePresence } from "framer-motion";
import "./CustomNavbar.css";

export default function CustomNavbar() {
  const { user, setUser, isLoggedIn, setIsLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const profilePicSize = 40;

  // Controlla se siamo nella pagina di login o register
  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);

    navigate("/");
  };

  const handleBrandClick = () => {
    if (user?.userType === "ADMINISTRATOR") navigate("/admin");
    else if (user?.userType === "PUBLIC_RELATIONS_OFFICER") navigate("/pro");
    else if (user?.userType === "TECHNICAL_STAFF_MEMBER") navigate("/tech");
    else navigate("/");
  };

  const [logoHover, setLogoHover] = useState(false);
  const [profileHover, setProfileHover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const profileMobileRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setDropdownOpen(o => !o);
  const closeDropdown = () => setDropdownOpen(false);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutsideDesktop = profileRef.current && !profileRef.current.contains(target);
      const isOutsideMobile = profileMobileRef.current && !profileMobileRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <Navbar
      sticky="top"
      className="custom-navbar"
      style={{
        transition: 'transform 0.3s ease',
        willChange: 'transform',
        zIndex: 10000
      }}
    >
      <Container fluid className="navbar-container">
        <div className="navbar-top-row">
          <div
            role="button"
            tabIndex={0}
            onClick={handleBrandClick}
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
            className="navbar-logo"
          >
            <motion.img
              src={logo}
              height={45}
              alt="Logo"
              style={{ display: 'block' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: logoHover ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <motion.div id = 'to-homepage'
            onClick={handleBrandClick}
            role="button"
            tabIndex={0}
            className="navbar-title-animated"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.3 }}
          >
            PARTICIPIUM
          </motion.div>

          <div className="navbar-right-section">
            <div className="navbar-desktop-actions d-none d-lg-flex align-items-center">
              {isLoggedIn && user?.userType === "CITIZEN" && <Notifications />}
              {isLoggedIn && (
                <div ref={profileRef} className="ms-3" style={{ position: 'relative' }}>
                  <motion.div
                    id="profile-dropdown"
                    role="button"
                    tabIndex={0}
                    onClick={toggleDropdown}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown();
                      }
                    }}
                    onMouseEnter={() => setProfileHover(true)}
                    onMouseLeave={() => setProfileHover(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 6,
                      cursor: 'pointer',
                      userSelect: 'none',
                      marginRight: '1rem',
                    }}
                    initial={false}
                    animate={{ scale: profileHover ? 1.06 : 1 }}
                    transition={{ duration: 0.18 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    {user?.username && (
                      <motion.span
                        style={{
                          color: '#0067c6',
                          marginRight: '0.55rem',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          textDecoration: 'underline',
                          textDecorationColor: '#0067c6',
                          textDecorationThickness: '2px',
                          textUnderlineOffset: '3px'
                        }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {user.username}
                      </motion.span>
                    )}
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt="User profile"
                        roundedCircle
                        width={profilePicSize}
                        height={profilePicSize}
                        style={{ objectFit: 'cover', border: '2px solid #E1AD01' }}
                      />
                    ) : (
                      <span style={{ width: profilePicSize, height: profilePicSize }} className="d-inline-flex align-items-center justify-content-center">
                        <FaUserCircle className="text-white" style={{ width: '100%', height: '100%' }} />
                      </span>
                    )}
                  </motion.div>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        key="profile-menu"
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          marginTop: '0.4rem',
                          backgroundColor: '#ffffffff',
                          color: '#00205B',
                          borderRadius: 14,
                          padding: '0.5rem 0.55rem 0.65rem',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                          minWidth: '200px',
                          zIndex: 30
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {user?.userType === 'CITIZEN' && (
                            <motion.div
                              layout
                              role="button"
                              tabIndex={0}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => { closeDropdown(); navigate('/profile'); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  closeDropdown();
                                  navigate('/profile');
                                }
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e6e6e6',
                                borderRadius: 10,
                                padding: '0.6rem 0.85rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                color: '#00205B',
                                transition: 'transform 0.18s, box-shadow 0.18s'
                              }}
                            >
                              Profile
                            </motion.div>
                          )}
                          <motion.div
                            layout
                            role="button"
                            tabIndex={0}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => { closeDropdown(); handleLogout(); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                closeDropdown();
                                handleLogout();
                              }
                            }}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e6e6e6',
                              borderRadius: 10,
                              padding: '0.6rem 0.85rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              color: '#c62828',
                              transition: 'transform 0.18s, box-shadow 0.18s'
                            }}
                          >
                            Logout
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {!isLoggedIn && (
                <Link
                  id="login-1"
                  to={isLoginPage ? "/" : "/login"}
                  className="btn btn-warning ms-3"
                  style={{
                    transition: 'transform 0.2s',
                    marginRight: '1rem'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
                >
                  {isLoginPage ? "Back to homepage" : "Login"}
                </Link>
              )}
            </div>

            {/* Notifiche e profilo compatte per mobile */}
            <div className="navbar-mobile-actions d-flex d-lg-none align-items-center">
              {isLoggedIn && user?.userType === "CITIZEN" && (
                <div className="navbar-mobile-notification">
                  <Notifications />
                </div>
              )}
              {isLoggedIn && (
                <div ref={profileMobileRef} className="ms-2 navbar-mobile-profile" style={{ position: 'relative' }}>
                  <motion.div
                    role="button"
                    tabIndex={0}
                    onClick={toggleDropdown}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown();
                      }
                    }}
                    initial={false}
                    animate={{ scale: profileHover ? 1.06 : 1 }}
                    transition={{ duration: 0.18 }}
                    style={{ cursor: 'pointer' }}
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt="User profile"
                        roundedCircle
                        width={32}
                        height={32}
                        style={{ objectFit: 'cover', border: '2px solid #E1AD01' }}
                      />
                    ) : (
                      <FaUserCircle className="text-white" style={{ width: 32, height: 32 }} />
                    )}
                  </motion.div>

                  {/* Dropdown mobile per profilo */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        key="profile-menu-mobile"
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          marginTop: '0.4rem',
                          backgroundColor: '#e8f0ff',
                          color: '#00205B',
                          borderRadius: 12,
                          padding: '0.4rem 0',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                          minWidth: '160px',
                          zIndex: 30
                        }}
                      >
                        {user?.userType === 'CITIZEN' && (
                            <button
                                type="button"
                                style={{
                                    // Stili per resettare l'aspetto del bottone
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    width: '100%',
                                    // Stili originali del div
                                    padding: '0.35rem 0.9rem',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 400,
                                    color: 'inherit', // Eredita il colore dal genitore
                                    transition: 'transform 0.18s'
                                }}
                                onClick={() => { closeDropdown(); navigate('/profile'); }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                Profile
                            </button>
                        )}
                          <button
                              type="button"
                              style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0.35rem 0.9rem',
                                  textAlign: 'left',
                                  // I tuoi stili
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  fontWeight: 600,
                                  color: '#c62828',
                                  transition: 'transform 0.18s'
                              }}
                              onClick={() => { closeDropdown(); handleLogout(); }}
                              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                              Logout
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {!isLoggedIn && (
                <Link
                  to={isLoginPage ? "/" : "/login"}
                  className="btn btn-warning ms-3"
                  style={{
                    transition: 'transform 0.2s',
                    fontSize: '0.9rem',
                    padding: '0.4rem 0.8rem'
                  }}
                >
                  {isLoginPage ? "Homepage" : "Login"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Navbar>
  );
}
