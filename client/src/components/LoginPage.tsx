import React, { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAppContext } from "../contexts/AppContext";
import LoginSignupNavbar from "./LoginSignupNavbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { setUserFromToken } = useAppContext();

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

      setUserFromToken(res.token);
      alert("Login successful!");
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
      <LoginSignupNavbar />
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
