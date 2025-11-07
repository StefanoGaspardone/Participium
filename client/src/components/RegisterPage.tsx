import React, { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, type RegisterPayload, uploadImages } from "../api/api";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [telegram, setTelegram] = useState("");
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl: string | null = null;

            if (profilePic) {
                imageUrl = await uploadImages(profilePic);
            }

            const payload: RegisterPayload = {
                email: email.trim(),
                password: password.trim(),
                firstName: name.trim(),
                lastName: surname.trim(),
                username: username.trim(),
                image: imageUrl,
                telegramUsername: telegram.trim() || null,
            };

            await registerUser(payload);

            alert("Registration completed successfully!");
            navigate("/login");
        } catch (err: any) {
            console.error("Registration error:", err);
            alert(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="my-5">
            <Row className="justify-content-md-center">
                <Col md={8} lg={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">Register</Card.Title>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="formName">
                                            <Form.Label>First Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Mario"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="formSurname">
                                            <Form.Label>Last Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Rossi"
                                                value={surname}
                                                onChange={(e) => setSurname(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="formUsername">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="mario.rossi"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="mario.rossi@mail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formSignupPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <hr />

                                {/* Optional fields */}
                                <Form.Group className="mb-3" controlId="formTelegram">
                                    <Form.Label>Telegram Username (Optional)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="@mario_rossi"
                                        value={telegram}
                                        onChange={(e) => setTelegram(e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formProfilePic">
                                    <Form.Label>Profile Picture (Optional)</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setProfilePic(e.target.files ? e.target.files[0] : null)
                                        }
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100 mt-3" disabled={loading}>
                                    {loading ? "Registering..." : "Register"}
                                </Button>
                            </Form>
                            <div className="mt-3 text-center">
                                Already have an account? <Link to="/login">Log in</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}