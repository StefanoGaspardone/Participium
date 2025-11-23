import { useState, useEffect, useRef } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useAppContext } from "../contexts/AppContext";
import { Image } from "react-bootstrap";
import Notifications from "./Notifications";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomNavbar() {
  const { user, setUser, isLoggedIn, setIsLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const profilePicSize = 40;

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

  // stato hover per ottimizzare (evita animazioni continue non necessarie)
  const [logoHover, setLogoHover] = useState(false);
  const [profileHover, setProfileHover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setDropdownOpen(o => !o);
  const closeDropdown = () => setDropdownOpen(false);

  // chiusura clic esterno
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top" style={{
      transition: 'transform 0.3s ease',
      willChange: 'transform'
    }}>
      <Container fluid className="position-relative d-flex align-items-center">
        {/* Brand left (only logo) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleBrandClick}
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', zIndex: 11, marginLeft: '1rem' }}
        >
          <motion.img
            src={logo}
            height={45}
            alt="Logo"
            style={{ display: 'block' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: logoHover ? 1.06 : 1 }}
            transition={{ type: 'tween', duration: 0.25 }}
          />
        </div>
        {/* Center title */}
        <motion.div
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          style={{
            position: 'absolute',
            left: '48%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            zIndex: 10,
            fontSize: '1.6rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: '#E1AD01',
            display: 'inline-block',
            userSelect: 'none',
            textDecoration: 'underline',
            textDecorationColor: '#E1AD01',
            textDecorationThickness: '2px',
            textUnderlineOffset: '3px'
          }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.3 }}
        >
          Participium
        </motion.div>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="ms-auto" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center">
            {isLoggedIn ? (
              <>
                {user?.userType === "CITIZEN" && <Notifications />}
                <div ref={profileRef} className="ms-3" style={{ position: 'relative' }}>
                  <motion.div
                    id="profile-dropdown"
                    role="button"
                    tabIndex={0}
                    onClick={toggleDropdown}
                    onMouseEnter={() => setProfileHover(true)}
                    onMouseLeave={() => setProfileHover(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 6,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    initial={false}
                    animate={{ scale: profileHover ? 1.06 : 1 }}
                    transition={{ duration: 0.18 }}
                  >
                    {user?.username && (
                      <motion.span
                        style={{
                          color: '#E1AD01',
                          marginRight: '0.55rem',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          textDecoration: 'underline',
                          textDecorationColor: '#E1AD01',
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
                          <div
                            style={{ padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 400, transition: 'transform 0.18s' }}
                            onClick={() => { closeDropdown(); navigate('/profile'); }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            Profile
                          </div>
                        )}
                        <div
                          style={{ padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#c62828', transition: 'transform 0.18s' }}
                          onClick={() => { closeDropdown(); handleLogout(); }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          Logout
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link id="login-1" to="/login" className="btn btn-warning ms-3" style={{
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
              >
                Login
              </Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
