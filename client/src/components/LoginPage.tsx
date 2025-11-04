// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

type Props = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function LoginPage({ setIsLoggedIn }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // --- Inizio Logica Mock (senza backend) ---
    // Simula un login se l'utente inserisce qualsiasi cosa
    if (username && password) {
      console.log("Login simulato:", { username, password });
      setIsLoggedIn(true);
      navigate("/"); // Reindirizza alla homepage
    } else {
      alert("Per favore, inserisci username e password.");
    }
    // --- Fine Logica Mock ---
  };

  return (
    <>
      <Container className="mt-4">
        <Row className="justify-content-md-center">
          <Col md={6} lg={4}>
            <Card>
              <Button className="w-100" variant="secondary" onClick={() => {navigate("/")}}> Go back to Homepage </Button>
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
                  <Form.Group className="mb-3" controlId="formBasicUsername">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Form.Group>

                  <Button variant="primary" type="submit" className="w-100">
                    Login
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
