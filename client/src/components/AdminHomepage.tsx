import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { Loader2Icon } from "lucide-react";
import { getOffices, createEmployee } from "../api/api";
import CustomNavbar from "./CustomNavbar";
import type { Office } from "../models/models";
import { useAppContext } from "../contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import "./AuthForms.css";
import { toast } from "react-hot-toast";
import Select, { components, type MenuProps, type SingleValue, type OptionProps } from "react-select";

export default function AdminHomepage() {
  const { user } = useAppContext();

  const [offices, setOffices] = useState<Office[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    userType: "",
    officeId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const roleOptions = [
    { value: "MUNICIPAL_ADMINISTRATOR", label: "Municipal Administrator" },
    { value: "PUBLIC_RELATIONS_OFFICER", label: "Municipal Public Relations Officer" },
    { value: "TECHNICAL_STAFF_MEMBER", label: "Technical Office Staff Member" },
  ];

  const roleIdByValue: Record<string, string> = {
    MUNICIPAL_ADMINISTRATOR: "municipal_administrator",
    PUBLIC_RELATIONS_OFFICER: "public_relations_officer",
    TECHNICAL_STAFF_MEMBER: "technical_staff_member",
  };

  const officeOptions = offices.map((o) => ({ value: String(o.id), label: o.name }));

  const AnimatedMenu = (props: MenuProps<any, false>) => (
    <AnimatePresence>
      {props.selectProps.menuIsOpen && (
        <components.Menu {...props}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {props.children}
          </motion.div>
        </components.Menu>
      )}
    </AnimatePresence>
  );

  const RoleOption = (props: OptionProps<any, false>) => {
    const id = roleIdByValue[props.data.value as string] ?? undefined;
    return (
      <div id={id}>
        <components.Option {...props} />
      </div>
    );
  };

  const OfficeOption = (props: OptionProps<any, false>) => {
    const id = `select-office${String(props.data.value)}`;
    return (
      <div id={id}>
        <components.Option {...props} />
      </div>
    );
  };

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await getOffices();
        setOffices(res);
      } catch (e) {
        console.error("Failed to load offices", e);
        toast.error("Unable to load offices.");
      } finally {
        setLoadingOffices(false);
      }
    };
    fetchOffices();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        userType: form.userType,
        ...(form.userType === "TECHNICAL_STAFF_MEMBER" && {
          officeId: Number(form.officeId),
        }),
      };
      await createEmployee(payload);
      toast.success("Employee account created successfully!");
      setForm({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        userType: "",
        officeId: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to create employee.");
      } else {
        const msg = String(err) || "Failed to create employee.";
        toast.error(msg);
      }
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // form validity: all required fields must be non-empty (trimmed)
  const isFormValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.username.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password.trim() !== "" &&
    form.userType !== "" &&
    (form.userType !== "TECHNICAL_STAFF_MEMBER" || form.officeId !== "");

  if (user?.userType !== "ADMINISTRATOR") {
    return (
      <>
        <CustomNavbar />
        <Container className="mt-5">
          <Alert variant="danger" className="text-center">
            Access denied: this page is reserved for administrators only.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <CustomNavbar />
      <Container className="my-5">
        <Row className="justify-content-md-center">
          <Col md={9} lg={7}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
              <Card className="auth-card">
                <Card.Body>
                  <motion.h2 className="text-center mb-4 auth-title" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    Welcome, Admin {user?.firstName ?? ""} {user?.lastName ?? ""}
                  </motion.h2>
                  <h4 className="mb-3 text-center">Create Employee Account</h4>

                  <Form onSubmit={handleSubmit} className="d-flex flex-column auth-grid-gap">
                    <Row>
                      <Col md={6}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }}>
                          <Form.Group className="mb-3 underline-anim">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                              id="first-name"
                              type="text"
                              name="firstName"
                              placeholder="Mario"
                              value={form.firstName}
                              onChange={handleChange}
                              required
                              className="auth-input"
                            />
                          </Form.Group>
                        </motion.div>
                      </Col>
                      <Col md={6}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17, duration: 0.4 }}>
                          <Form.Group className="mb-3 underline-anim">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                              id="last-name"
                              type="text"
                              name="lastName"
                              placeholder="Rossi"
                              value={form.lastName}
                              onChange={handleChange}
                              required
                              className="auth-input"
                            />
                          </Form.Group>
                        </motion.div>
                      </Col>
                    </Row>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
                      <Form.Group className="mb-3 underline-anim">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                          id="username"
                          type="text"
                          name="username"
                          placeholder="mario.rossi"
                          value={form.username}
                          onChange={handleChange}
                          required
                          className="auth-input"
                        />
                      </Form.Group>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27, duration: 0.4 }}>
                      <Form.Group className="mb-3 underline-anim">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          id="email"
                          type="email"
                          name="email"
                          placeholder="mario.rossi@example.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                          className="auth-input"
                        />
                      </Form.Group>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.4 }}>
                      <Form.Group className="mb-3 underline-anim">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          id="password"
                          type="password"
                          name="password"
                          placeholder="Password123!"
                          value={form.password}
                          onChange={handleChange}
                          required
                          className="auth-input"
                        />
                      </Form.Group>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37, duration: 0.4 }}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Select
                          inputId="open-roles"
                          instanceId="open-roles"
                          options={roleOptions}
                          value={roleOptions.find((o) => o.value === form.userType) ?? null}
                          onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                            setForm((prev) => ({ ...prev, userType: opt?.value ?? "" }))
                          }
                          isDisabled={isSubmitting}
                          placeholder="Select a role"
                          components={{ Menu: AnimatedMenu, Option: RoleOption }}
                          classNamePrefix="rs"
                        />
                      </Form.Group>
                    </motion.div>

                    {form.userType === "TECHNICAL_STAFF_MEMBER" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.4 }}>
                        <Form.Group className="mb-3">
                          <Form.Label>Office Category</Form.Label>
                          <Select
                            inputId="open-offices"
                            instanceId="open-offices"
                            options={officeOptions}
                            value={officeOptions.find((o) => o.value === form.officeId) ?? null}
                            onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                              setForm((prev) => ({ ...prev, officeId: opt?.value ?? "" }))
                            }
                            isDisabled={loadingOffices || isSubmitting}
                            placeholder="Select a technical office"
                            components={{ Menu: AnimatedMenu, Option: OfficeOption }}
                            classNamePrefix="rs"
                          />
                        </Form.Group>
                      </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.45 }}>
                      <Button
                        id="create-account-button"
                        variant="primary"
                        type="submit"
                        className={`w-100 mt-2 auth-button-primary`}
                        disabled={!isFormValid || isSubmitting}
                        aria-disabled={!isFormValid || isSubmitting}
                        aria-busy={isSubmitting}
                        title={!isFormValid ? "Fill all required fields to enable" : isSubmitting ? "Creating account..." : "Create account"}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2Icon size={18} className="spin" aria-hidden="true" />
                            <span>Creating…</span>
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </motion.div>
                  </Form>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
