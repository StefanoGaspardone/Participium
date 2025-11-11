import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";

export default function CustomNavbar() {
  const navigate = useNavigate();

  const { setUser, isLoggedIn, setIsLoggedIn } = useAppContext();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);

    navigate("/login");
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src={logo}
            height={40}
            className="d-inline-block align-top me-2"
            alt="Logo"
          />
          <span className="text-warning font-regal fs-3">Participium</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center">
            {isLoggedIn ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/profile"
                  className="me-2 text-white"
                  title="Profilo"
                >
                  <FaUserCircle size={30} />
                </Nav.Link>
                <Button variant="outline-light" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" className="btn btn-warning">
                {" "}
                Login{" "}
              </Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
