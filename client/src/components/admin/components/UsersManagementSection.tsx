import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { Loader2Icon } from "lucide-react";
import { motion } from "framer-motion";
import Select, { type SingleValue, type MultiValue } from "react-select";
import { toast } from "react-hot-toast";
import { createEmployee, createCompany } from "../../../api/api";
import type { Office, Company, Category } from "../../../models/models";
import { AnimatedMenu } from "./AnimatedMenu";
import {
  RoleOption,
  OfficeOption,
  CompanyOption,
  roleOptions,
} from "./SelectOptions";

interface Props {
  offices: Office[];
  companies: Company[];
  categories: Category[];
  loadingOffices: boolean;
  loadingCompanies: boolean;
  loadingCategories: boolean;
  refreshCompanies: () => Promise<Company[]>;
}

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  userType: string;
  officeIds: string[];
  companyId: string;
}

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  userType: "",
  officeIds: [],
  companyId: "",
};

export default function UsersManagementSection({
  offices,
  companies,
  categories,
  loadingOffices,
  loadingCompanies,
  loadingCategories,
  refreshCompanies,
}: Props) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCategories, setNewCompanyCategories] = useState<Category[]>(
    []
  );
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  const officeOptions = offices.map((o) => ({
    value: String(o.id),
    label: o.name,
  }));
  const companyOptions = companies.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  const categoryOptions = categories.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  const isFormValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.username.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password.trim() !== "" &&
    form.userType !== "" &&
    (form.userType !== "TECHNICAL_STAFF_MEMBER" ||
      form.officeIds.length !== 0) &&
    (form.userType !== "EXTERNAL_MAINTAINER" || form.companyId !== "");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error("Company name cannot be empty.");
      return;
    }
    if (newCompanyCategories.length === 0) {
      toast.error("Please select at least one category.");
      return;
    }
    setIsCreatingCompany(true);
    try {
      await createCompany({
        id: 0,
        name: newCompanyName.trim(),
        categories: newCompanyCategories,
      });
      toast.success("Company created successfully!");
      const res = await refreshCompanies();
      const newCompany = res.find(
        (c: Company) => c.name === newCompanyName.trim()
      );
      if (newCompany) {
        setForm((prev) => ({ ...prev, companyId: String(newCompany.id) }));
      }
      setNewCompanyName("");
      setNewCompanyCategories([]);
      setShowNewCompanyForm(false);
    } catch (err) {
      console.error("Failed to create company", err);
      toast.error("Failed to create company.");
    } finally {
      setIsCreatingCompany(false);
    }
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
          officeIds: form.officeIds.map(Number),
        }),
        ...(form.userType === "EXTERNAL_MAINTAINER" && {
          companyId: Number(form.companyId),
        }),
      };
      await createEmployee(payload);
      toast.success("Employee account created successfully!");
      setForm(initialFormState);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to create employee.");
      } else {
        toast.error(String(err) || "Failed to create employee.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h4 className="mb-3 text-center">Municipality Users Management</h4>
      <Form
        onSubmit={handleSubmit}
        className="d-flex flex-column auth-grid-gap"
      >
        <Row>
          <Col md={6}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
            >
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17, duration: 0.4 }}
            >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27, duration: 0.4 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.37, duration: 0.4 }}
        >
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Select
              inputId="open-roles"
              instanceId="open-roles"
              options={roleOptions}
              value={roleOptions.find((o) => o.value === form.userType) ?? null}
              onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                setForm((prev) => ({
                  ...prev,
                  userType: opt?.value ?? "",
                }))
              }
              isDisabled={isSubmitting}
              placeholder="Select a role"
              components={{
                Menu: AnimatedMenu,
                Option: RoleOption,
              }}
              classNamePrefix="rs"
            />
          </Form.Group>
        </motion.div>

        {form.userType === "TECHNICAL_STAFF_MEMBER" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.4 }}
          >
            <Form.Group className="mb-3">
              <Form.Label>Assigned Offices</Form.Label>
              <Select<{ value: string; label: string }, true>
                inputId="open-offices"
                instanceId="open-offices"
                options={officeOptions}
                value={officeOptions.filter((o) =>
                  form.officeIds.includes(o.value)
                )}
                onChange={(
                  opts: MultiValue<{ value: string; label: string }>
                ) =>
                  setForm((prev) => ({
                    ...prev,
                    officeIds: opts.map((o) => o.value),
                  }))
                }
                isDisabled={loadingOffices || isSubmitting}
                placeholder="Select one or more offices"
                components={{
                  Menu: AnimatedMenu as any,
                  Option: OfficeOption as any,
                }}
                isMulti
                classNamePrefix="rs"
              />
            </Form.Group>
          </motion.div>
        )}

        {form.userType === "EXTERNAL_MAINTAINER" && (
          <ExternalMaintainerFields
            form={form}
            setForm={setForm}
            companyOptions={companyOptions}
            categoryOptions={categoryOptions}
            categories={categories}
            loadingCompanies={loadingCompanies}
            loadingCategories={loadingCategories}
            isSubmitting={isSubmitting}
            showNewCompanyForm={showNewCompanyForm}
            setShowNewCompanyForm={setShowNewCompanyForm}
            newCompanyName={newCompanyName}
            setNewCompanyName={setNewCompanyName}
            newCompanyCategories={newCompanyCategories}
            setNewCompanyCategories={setNewCompanyCategories}
            isCreatingCompany={isCreatingCompany}
            handleCreateCompany={handleCreateCompany}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
        >
          <Button
            id="create-account-button"
            variant="primary"
            type="submit"
            className="w-100 mt-2 auth-button-primary"
            disabled={!isFormValid || isSubmitting}
            aria-disabled={!isFormValid || isSubmitting}
            aria-busy={isSubmitting}
            title={
              !isFormValid
                ? "Fill all required fields to enable"
                : isSubmitting
                ? "Creating account..."
                : "Create account"
            }
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
    </>
  );
}

interface ExternalMaintainerFieldsProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  companyOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  categories: Category[];
  loadingCompanies: boolean;
  loadingCategories: boolean;
  isSubmitting: boolean;
  showNewCompanyForm: boolean;
  setShowNewCompanyForm: (v: boolean) => void;
  newCompanyName: string;
  setNewCompanyName: (v: string) => void;
  newCompanyCategories: Category[];
  setNewCompanyCategories: (v: Category[]) => void;
  isCreatingCompany: boolean;
  handleCreateCompany: () => void;
}

function ExternalMaintainerFields({
  form,
  setForm,
  companyOptions,
  categoryOptions,
  categories,
  loadingCompanies,
  loadingCategories,
  isSubmitting,
  showNewCompanyForm,
  setShowNewCompanyForm,
  newCompanyName,
  setNewCompanyName,
  newCompanyCategories,
  setNewCompanyCategories,
  isCreatingCompany,
  handleCreateCompany,
}: ExternalMaintainerFieldsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.4 }}
    >
      <Form.Group className="mb-3">
        <Form.Label>Company</Form.Label>
        <Select
          inputId="open-companies"
          instanceId="open-companies"
          options={companyOptions}
          value={companyOptions.find((c) => c.value === form.companyId) ?? null}
          onChange={(opt: SingleValue<{ value: string; label: string }>) =>
            setForm((prev) => ({
              ...prev,
              companyId: opt?.value ?? "",
            }))
          }
          isDisabled={loadingCompanies || isSubmitting}
          placeholder="Select a company"
          components={{
            Menu: AnimatedMenu,
            Option: CompanyOption,
          }}
          classNamePrefix="rs"
        />
      </Form.Group>
      <div className="d-flex flex-column gap-2 mb-3">
        {showNewCompanyForm ? (
          <NewCompanyForm
            newCompanyName={newCompanyName}
            setNewCompanyName={setNewCompanyName}
            categoryOptions={categoryOptions}
            categories={categories}
            newCompanyCategories={newCompanyCategories}
            setNewCompanyCategories={setNewCompanyCategories}
            loadingCategories={loadingCategories}
            isCreatingCompany={isCreatingCompany}
            handleCreateCompany={handleCreateCompany}
            onCancel={() => {
              setShowNewCompanyForm(false);
              setNewCompanyName("");
              setNewCompanyCategories([]);
            }}
          />
        ) : (
          <Button
            id="add-new-company-button"
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowNewCompanyForm(true)}
            disabled={isSubmitting}
          >
            + Add New Company
          </Button>
        )}
      </div>
    </motion.div>
  );
}

interface NewCompanyFormProps {
  newCompanyName: string;
  setNewCompanyName: (v: string) => void;
  categoryOptions: { value: string; label: string }[];
  categories: Category[];
  newCompanyCategories: Category[];
  setNewCompanyCategories: (v: Category[]) => void;
  loadingCategories: boolean;
  isCreatingCompany: boolean;
  handleCreateCompany: () => void;
  onCancel: () => void;
}

function NewCompanyForm({
  newCompanyName,
  setNewCompanyName,
  categoryOptions,
  categories,
  newCompanyCategories,
  setNewCompanyCategories,
  loadingCategories,
  isCreatingCompany,
  handleCreateCompany,
  onCancel,
}: NewCompanyFormProps) {
  return (
    <div className="border rounded p-3" style={{ backgroundColor: "#f8f9fa" }}>
      <Form.Group className="mb-3">
        <Form.Label>Company Name</Form.Label>
        <Form.Control
          id="new-company-name"
          type="text"
          placeholder="Enter company name"
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          disabled={isCreatingCompany}
          className="auth-input"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Categories</Form.Label>
        <Select<{ value: string; label: string }, true>
          inputId="new-company-categories"
          instanceId="new-company-categories"
          options={categoryOptions}
          value={categoryOptions.filter((opt) =>
            newCompanyCategories.some((cat) => String(cat.id) === opt.value)
          )}
          onChange={(opts: MultiValue<{ value: string; label: string }>) => {
            const selectedCategories = opts.map((opt) => {
              const cat = categories.find((c) => String(c.id) === opt.value);
              return cat!;
            });
            setNewCompanyCategories(selectedCategories);
          }}
          isMulti
          isDisabled={loadingCategories || isCreatingCompany}
          placeholder="Select categories"
          classNamePrefix="rs"
        />
      </Form.Group>
      <div className="d-flex gap-2">
        <Button
          id="create-company-button"
          variant="success"
          size="sm"
          onClick={handleCreateCompany}
          disabled={
            isCreatingCompany ||
            !newCompanyName.trim() ||
            newCompanyCategories.length === 0
          }
        >
          {isCreatingCompany ? (
            <>
              <Loader2Icon size={14} className="spin" />
              <span className="ms-1">Creating...</span>
            </>
          ) : (
            "Create Company"
          )}
        </Button>
        <Button
          id="cancel-company-button"
          variant="outline-secondary"
          size="sm"
          onClick={onCancel}
          disabled={isCreatingCompany}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
