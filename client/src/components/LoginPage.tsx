import React, { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAppContext } from "../contexts/AppContext";
import { motion } from "framer-motion";
import "./AuthForms.css";
import { toast } from "react-hot-toast";
import CustomNavbar from "./CustomNavbar.tsx";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);



  const { setUserFromToken } = useAppContext();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser({
        username: username.trim(),
        password: password.trim(),
      });

      setUserFromToken(res.token);
      toast.success(`Welcome ${username}!`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid credentials or server error.";
      console.error("Login error:", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomNavbar />
      <Container className="mt-5">
        <Row className="justify-content-md-center">
          <Col md={6} lg={5}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
              <Card className="auth-card">
                <Card.Body>
                  <motion.h2 className="text-center mb-4 auth-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>Login</motion.h2>
                  <Form onSubmit={handleSubmit} className="d-flex flex-column auth-grid-gap">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
                      <Form.Group controlId="formBasicUsername" className="mb-3 underline-anim">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                          id="username"
                          type="text"
                          placeholder="Enter username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="auth-input"
                        />
                      </Form.Group>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
                      <Form.Group controlId="formBasicPassword" className="mb-2 underline-anim">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          id="password"
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="auth-input"
                        />
                      </Form.Group>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.45 }}>
                      <Button
                        id="submit-button"
                        variant="primary"
                        type="submit"
                        className="w-100 auth-button-primary"
                        disabled={loading}
                      >
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                    </motion.div>
                  </Form>
                  <motion.div className="mt-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4 }}>
                    You don't have an account?{" "}
                    <Link id="register-redirect" to="/register" className="auth-link-inline">Register</Link>
                  </motion.div>
                  <motion.div className="mt-1 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4 }}>
                    Still have to active your account?{" "}
                    <Link id="code-confirm-redirect" to="/confirm-code" state={{ username: username.trim() }} className="auth-link-inline">Click here</Link>
                  </motion.div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
