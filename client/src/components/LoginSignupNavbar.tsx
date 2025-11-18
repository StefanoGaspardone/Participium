import { useState } from "react";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function LoginSignupNavbar() {
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);

    return (
        <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
            <Container fluid className="position-relative">
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center ms-3">
                    <img
                        src={logo}
                        height={45}
                        className="d-inline-block align-top"
                        alt="Logo"
                    />
                </Navbar.Brand>
                <Link
                    to="/"
                    className="text-warning font-regal fs-3 text-decoration-none position-absolute"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                    }}
                >
                    Participium
                </Link>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
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
                            style={{ transform: hover ? 'scale(1.04)' : 'none', transition: 'transform 160ms ease' }}
                        >
                            Go back to Homepage
                        </Button>
                    </Nav>
                </Navbar.Collapse>

            </Container>
        </Navbar>
    )
}