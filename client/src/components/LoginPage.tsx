import React, { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/api"; // importa la funzione API
import { useAuth } from "../hooks/useAuth";
import { jwtDecode } from "jwt-decode";

type Props = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
};

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

export default function LoginPage({ setIsLoggedIn, user, setUser }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { reloadAuth } = useAuth(user, setUser);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser({
        email: email.trim(),
        password: password.trim(),
      });

      // Persist token and refresh auth state
      localStorage.setItem("token", res.token);
      reloadAuth();

      setIsLoggedIn(true);
      alert("Login successful!");

      // Navigate based on role decoded from the fresh token to avoid stale user state
      type Payload = { userId: number; role: string };
      const decoded = jwtDecode<Payload>(res.token);
      console.log("ROLE ===> " + decoded.role);
      if (decoded.role === "ADMINISTRATOR") {
        navigate("/admin");
      } else navigate("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid credentials or server error.";
      console.error("Login error:", error);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container className="mt-4">
        <Row className="justify-content-md-center">
          <Col md={6} lg={4}>
            <Card>
              <Button
                className="w-100"
                variant="secondary"
                onClick={() => {
                  navigate("/");
                }}
              >
                Go back to Homepage
              </Button>
            </Card>
          </Col>
        </Row>
      </Container>

      <Container className="mt-5">
        <Row className="justify-content-md-center">
          <Col md={6} lg={4}>
            <Card>
              <Card.Body>
                <Card.Title className="text-center mb-4">Login</Card.Title>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </Form>

                <div className="mt-3 text-center">
                  You don't have an account?{" "}
                  <Link to="/register">Register</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
