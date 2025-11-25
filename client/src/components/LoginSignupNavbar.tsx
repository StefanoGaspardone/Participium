import { useState } from "react";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { motion } from "framer-motion";

export default function LoginSignupNavbar() {
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);
    const [logoHover, setLogoHover] = useState(false);

    return (
        <Navbar bg="primary" variant="dark" expand="lg" sticky="top" style={{
            transition: 'transform 0.3s ease',
            willChange: 'transform'
        }}>
            <Container fluid className="position-relative d-flex align-items-center">
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/')}
                    onMouseEnter={() => setLogoHover(true)}
                    onMouseLeave={() => setLogoHover(false)}
                    className="d-flex align-items-center ms-3"
                    style={{ cursor: 'pointer', zIndex: 11 }}
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
                    onClick={() => navigate('/')}
                    role="button"
                    tabIndex={0}
                    className="position-absolute"
                    style={{
                        left: '45%',
                        transform: 'translate(-50%, -50%)',
                        cursor: 'pointer',
                        zIndex: 10,
                        fontSize: '1.6rem',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        color: '#E1AD01',
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
                    <Nav className="ms-auto">
                        <Button
                            id="go-to-homepage-button"
                            variant="warning"
                            onClick={() => navigate("/")}
                            onMouseEnter={() => setHover(true)}
                            onMouseLeave={() => setHover(false)}
                            onFocus={() => setHover(true)}
                            onBlur={() => setHover(false)}
                            style={{
                                transform: hover ? 'translateY(-2px) scale(1.06)' : 'translateY(0) scale(1)',
                                transition: 'transform 0.2s ease'
                            }}
                        >
                            Go back to Homepage
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}