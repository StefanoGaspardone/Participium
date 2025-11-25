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

  const [logoHover, setLogoHover] = useState(false);
  const [profileHover, setProfileHover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setDropdownOpen(o => !o);
  const closeDropdown = () => setDropdownOpen(false);

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
        <motion.div
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          style={{
            position: 'absolute',
            left: '45%',
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
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => { closeDropdown(); navigate('/profile'); }}
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
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => { closeDropdown(); handleLogout(); }}
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
