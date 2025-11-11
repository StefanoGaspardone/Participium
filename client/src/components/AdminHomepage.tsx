import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { getOffices, createEmployee } from "../api/api";
import CustomNavbar from "./CustomNavbar";
import type { Office } from "../models/models";
import { useAppContext } from "../contexts/AppContext";

export default function AdminHomepage() {
  const { user } = useAppContext();

  const [offices, setOffices] = useState<Office[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    userType: "",
    officeId: "",
  });

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await getOffices();
        setOffices(res);
      } catch (e) {
        console.error("Failed to load offices", e);
        setError("Unable to load offices.");
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
    setError(null);
    setSuccessMsg("");
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
      alert("Employee account created successfully!");
      setForm({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        userType: "",
        officeId: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create employee.");
    }
  };

  if (user?.userType !== "ADMINISTRATOR") {
    return (
      <>
        <CustomNavbar/>
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
      <CustomNavbar/>
      <Container className="mt-5">
        <h2 className="text-center mb-4">
          Welcome, Admin {user?.firstName ?? ""} {user?.lastName ?? ""}
        </h2>

        <Card className="p-4 mx-auto" style={{ maxWidth: "600px" }}>
          <h4 className="mb-3 text-center">Create Employee Account</h4>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="userType"
                value={form.userType}
                onChange={handleChange}
                required
              >
                <option value="CITIZEN">
                  Citizen
                </option>
                <option value="ADMINISTRATOR">
                  Administrator
                </option>
                <option value="MUNICIPAL_ADMINISTRATOR">
                  Municipal Administrator
                </option>
                <option value="PUBLIC_RELATIONS_OFFICER">
                  Municipal Public Relations Officer
                </option>
                <option value="TECHNICAL_STAFF_MEMBER">
                  Technical Office Staff Member
                </option>
              </Form.Select>
            </Form.Group>

            {form.userType === "TECHNICAL_STAFF_MEMBER" && (
              <Form.Group className="mb-3">
                <Form.Label>Office Category</Form.Label>
                <Form.Select
                  name="officeId"
                  value={form.officeId}
                  onChange={handleChange}
                  disabled={loadingOffices}
                  required
                >
                  <option value="">Select a technical office</option>
                  {offices.map((office) => (
                    <option key={office.id} value={String(office.id)}>
                      {office.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Button variant="primary" type="submit" className="w-100">
              Create Account
            </Button>
          </Form>
        </Card>
      </Container>
    </>
  );
}
