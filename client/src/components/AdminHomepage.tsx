import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Loader2Icon } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Failed to create employee.");
      else setError(String(err) || "Failed to create employee.");
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
                id="first-name"
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
                id="last-name"
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
                id="username"
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
                id="email"
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
                id="password"
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
                id="open-roles"
                name="userType"
                value={form.userType}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select a role
                </option>
                <option id="municipal_administrator" value="MUNICIPAL_ADMINISTRATOR">
                  Municipal Administrator
                </option>
                <option id="public_relations_officer" value="PUBLIC_RELATIONS_OFFICER">
                  Municipal Public Relations Officer
                </option>
                <option id="technical_staff_member" value="TECHNICAL_STAFF_MEMBER">
                  Technical Office Staff Member
                </option>
              </Form.Select>
            </Form.Group>

            {form.userType === "TECHNICAL_STAFF_MEMBER" && (
              <Form.Group className="mb-3">
                <Form.Label>Office Category</Form.Label>
                <Form.Select 
                  id="open-offices" 
                  name="officeId"
                  value={form.officeId}
                  onChange={handleChange}
                  disabled={loadingOffices}
                  required
                >
                  <option value="" disabled>Select a technical office</option>
                  {offices.map((office) => (
                    <option id="select-office"key={office.id} value={String(office.id)}>
                      {office.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Button
              id="create-account-button"
              variant="primary"
              type="submit"
              className={`w-100 d-inline-flex align-items-center justify-content-center gap-2`}
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
          </Form>
        </Card>
      </Container>
    </>
  );
}
