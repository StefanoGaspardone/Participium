import { Navbar, Nav, Container } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useAppContext } from "../contexts/AppContext";
import { Image } from "react-bootstrap";
import { Dropdown } from 'react-bootstrap';
import "./CustomNavbar.css";

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
    // If admin, send to /admin, otherwise to homepage '/'
    if (user?.userType === "ADMINISTRATOR") navigate("/admin");
    else navigate("/");
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container fluid className="position-relative">
        <Navbar.Brand
          role="button"
          tabIndex={0}
          onClick={handleBrandClick}
          className="d-flex align-items-center ms-2"
        >
          <img
            src={logo}
            height={45}
            className="d-inline-block align-top me-2"
            alt="Logo"
          />
        </Navbar.Brand>
        <div
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          className="text-warning font-regal fs-3 text-decoration-none position-absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            cursor: 'pointer'
          }}
        >
          Participium
        </div>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center">
            {isLoggedIn ? (
              <Dropdown align="end" className="me-3">
                <Dropdown.Toggle
                  as="div"
                  id="profile-dropdown"
                  className="profile-toggle d-inline-flex align-items-center justify-content-center text-white fw-semibold"
                  role="button"
                  tabIndex={0}
                >
                  {/* username on the left of the icon */}
                  {user?.username && (
                    <span className="profile-username">{user.username}</span>
                  )}

                  {user?.image ? (
                    <Image
                      id="profile-picture"
                      src={user.image}
                      alt="User profile"
                      roundedCircle
                      width={profilePicSize}
                      height={profilePicSize}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span id="profile-picture" className="profile-icon d-inline-flex align-items-center justify-content-center">
                      <FaUserCircle className="text-white" />
                    </span>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu
                  className="dropdown-menu-end shadow-sm border-0 rounded-3 mt-2"
                  style={{
                    backgroundColor: '#e8f0ff',
                    color: '#00205B',
                  }}
                >
                  {/*
                  <Dropdown.Item as={Link} to="/profile">
                    Profile
                  </Dropdown.Item>
                  */}

                  { /*<Dropdown.Divider />*/}
                  <Dropdown.Item
                    id="logout-button"
                    onClick={handleLogout}
                    className="fw-semibold"
                    style={{
                      color: '#c62828',
                    }}
                  >
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Link
                id="login-1"
                to="/login"
                className="btn btn-warning me-3"
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
