import React, { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, type RegisterPayload, uploadImages } from "../api/api";
import LoginSignupNavbar from "./LoginSignupNavbar";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import "./AuthForms.css";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [telegram, setTelegram] = useState("");
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(false);
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
                emailNotificationsEnabled: emailNotifications
            };

            await registerUser(payload);

            toast.success("Registration completed!");
            navigate("/login");
        } catch (err: any) {
            console.error("Registration error:", err);
            toast.error(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <LoginSignupNavbar />
            <Container className="my-5">
                <Row className="justify-content-md-center">
                    <Col md={9} lg={7}>
                        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
                            <Card className="auth-card">
                                <Card.Body>
                                    <motion.h2 className="text-center mb-4 auth-title" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>Register</motion.h2>
                                    <Form onSubmit={handleSubmit} className="d-flex flex-column auth-grid-gap">
                                        <Row>
                                            <Col md={6}>
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }}>
                                                    <Form.Group className="mb-3" controlId="formName">
                                                        <Form.Label>First Name</Form.Label>
                                                        <Form.Control
                                                            id="first-name"
                                                            type="text"
                                                            placeholder="Mario"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            required
                                                            className="auth-input"
                                                        />
                                                    </Form.Group>
                                                </motion.div>
                                            </Col>
                                            <Col md={6}>
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17, duration: 0.4 }}>
                                                    <Form.Group className="mb-3" controlId="formSurname">
                                                        <Form.Label>Last Name</Form.Label>
                                                        <Form.Control
                                                            id="last-name"
                                                            type="text"
                                                            placeholder="Rossi"
                                                            value={surname}
                                                            onChange={(e) => setSurname(e.target.value)}
                                                            required
                                                            className="auth-input"
                                                        />
                                                    </Form.Group>
                                                </motion.div>
                                            </Col>
                                        </Row>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
                                            <Form.Group className="mb-3" controlId="formUsername">
                                                <Form.Label>Username</Form.Label>
                                                <Form.Control
                                                    id="username"
                                                    type="text"
                                                    placeholder="mario.rossi"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    required
                                                    className="auth-input"
                                                />
                                            </Form.Group>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27, duration: 0.4 }}>
                                            <Form.Group className="mb-3" controlId="formEmail">
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control
                                                    id="email"
                                                    type="email"
                                                    placeholder="mario.rossi@mail.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="auth-input"
                                                />
                                            </Form.Group>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.4 }}>
                                            <Form.Group className="mb-3" controlId="formSignupPassword">
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
                                        <hr />
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37, duration: 0.4 }}>
                                            <Form.Group className="mb-3" controlId="formTelegram">
                                                <Form.Label>Telegram Username (Optional)</Form.Label>
                                                <Form.Control
                                                    id="tg_username"
                                                    type="text"
                                                    placeholder="@mario_rossi"
                                                    value={telegram}
                                                    onChange={(e) => setTelegram(e.target.value)}
                                                    className="auth-input"
                                                />
                                            </Form.Group>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.4 }}>
                                            <Form.Group className="mb-3" controlId="formProfilePic">
                                                <Form.Label>Profile Picture (Optional)</Form.Label>
                                                <Form.Control
                                                    id="image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        setProfilePic(e.target.files ? e.target.files[0] : null)
                                                    }
                                                    className="auth-input"
                                                />
                                            </Form.Group>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.47, duration: 0.4 }}>
                                            <Form.Group className="mb-3 auth-switch" controlId="formEmailNotifications">
                                                <Form.Check
                                                    type="switch"
                                                    label="Receive email notifications"
                                                    checked={emailNotifications}
                                                    onChange={(e) => setEmailNotifications(e.target.checked)}
                                                />
                                            </Form.Group>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.45 }}>
                                            <Button id="submit-button" variant="primary" type="submit" className="w-100 mt-2 auth-button-primary" disabled={loading}>
                                                {loading ? "Registering..." : "Register"}
                                            </Button>
                                        </motion.div>
                                    </Form>
                                    <motion.div className="mt-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.45 }}>
                                        Already have an account? <Link id="login-redirect" to="/login" className="auth-link-inline">Log in</Link>
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