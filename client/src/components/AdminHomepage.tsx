import { useEffect, useState } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import { Loader2Icon, XIcon } from "lucide-react";
import {
  getOffices,
  createEmployee,
  getAllCompanies,
  createCompany,
  getCategories,
  getTechnicalStaffMembers,
  getTsmOffices,
  updateTsmOffices,
} from "../api/api";
import CustomNavbar from "./CustomNavbar";
import type { Office, Company, Category } from "../models/models";
import { useAppContext } from "../contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import "./AuthForms.css";
import { toast } from "react-hot-toast";
import Select, {
  components,
  type MenuProps,
  type SingleValue,
  type MultiValue,
  type OptionProps,
} from "react-select";
import { isApiError } from "../models/models";

type SelectOptionProps = OptionProps<any, false> & {
  idPrefix: string;
};

export const SelectOption = (props: SelectOptionProps) => {
  const id = `${props.idPrefix}${String(props.data?.value ?? "")}`;
  return (
    <div id={id}>
      <components.Option {...props} />
    </div>
  );
};

const ROLE_ID_BY_VALUE: Record<string, string> = {
  MUNICIPAL_ADMINISTRATOR: "municipal_administrator",
  PUBLIC_RELATIONS_OFFICER: "public_relations_officer",
  TECHNICAL_STAFF_MEMBER: "technical_staff_member",
  EXTERNAL_MAINTAINER: "external_maintainer",
};

export const RoleOption = (props: OptionProps<any, false>) => {
  const idPrefix = ROLE_ID_BY_VALUE[props.data.value] ?? "select-role";
  return <SelectOption {...props} idPrefix={idPrefix} />;
};

export const OfficeOption = (
  props: OptionProps<any, false> & { idPrefix?: string }
) => {
  return (
    <SelectOption {...props} idPrefix={props.idPrefix ?? "select-office"} />
  );
};

export const CompanyOption = (
  props: OptionProps<any, false> & { idPrefix?: string }
) => {
  return (
    <SelectOption {...props} idPrefix={props.idPrefix ?? "select-company"} />
  );
};

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

export default function AdminHomepage() {
  const { user } = useAppContext();

  const [offices, setOffices] = useState<Office[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCategories, setNewCompanyCategories] = useState<Category[]>(
    []
  );
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    userType: "",
    officeIds: [] as string[],
    companyId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Technical Offices Management
  type TSM = { id: number; name: string };
  const [tsms, setTsms] = useState<TSM[]>([]);
  const [loadingTsms, setLoadingTsms] = useState<boolean>(true);
  const [selectedTsmId, setSelectedTsmId] = useState<number | null>(null);
  const [tsmOfficeIds, setTsmOfficeIds] = useState<number[]>([]);
  const [savedTsmOfficeIds, setSavedTsmOfficeIds] = useState<number[] | null>(
    null
  );
  const [loadingTsmOffices, setLoadingTsmOffices] = useState<boolean>(false);
  const [isSavingTsm, setIsSavingTsm] = useState(false);

  const [selectedSection, setSelectedSection] = useState<"users" | "offices">(
    "users"
  );

  const roleOptions = [
    { value: "MUNICIPAL_ADMINISTRATOR", label: "Municipal Administrator" },
    {
      value: "PUBLIC_RELATIONS_OFFICER",
      label: "Municipal Public Relations Officer",
    },
    { value: "TECHNICAL_STAFF_MEMBER", label: "Technical Office Staff Member" },
    { value: "EXTERNAL_MAINTAINER", label: "External Maintainer" },
  ];

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
    const fetchCompanies = async () => {
      try {
        const res = await getAllCompanies();
        setCompanies(res || []);
      } catch (e) {
        console.error("Failed to load companies", e);
        toast.error("Unable to load companies.");
      } finally {
        setLoadingCompanies(false);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res);
      } catch (e) {
        console.error("Failed to load categories", e);
        toast.error("Unable to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchOffices();
    fetchCompanies();
    fetchCategories();
  }, []);

  // Fetch technical staff members from API
  useEffect(() => {
    const fetchTsms = async () => {
      setLoadingTsms(true);
      try {
        const res = await getTechnicalStaffMembers();
        setTsms(
          Array.isArray(res)
            ? res.map((t: any) => ({
                id: Number(t.id),
                name: `${String(t.firstName ?? "")} ${String(
                  t.lastName ?? ""
                )} (${String(t.username ?? "")})`.trim(),
              }))
            : []
        );
      } catch (e) {
        console.error("Failed to load technical staff members", e);
        toast.error("Unable to load technical staff members.");
      } finally {
        setLoadingTsms(false);
      }
    };
    fetchTsms();
  }, []);

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
      const res = await getAllCompanies();
      setCompanies(res || []);
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
      setForm({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        userType: "",
        officeIds: [],
        companyId: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to create employee.");
      } else {
        const msg = String(err) || "Failed to create employee.";
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Technical Offices Management
  const handleSelectTsm = async (id: number | null) => {
    setSelectedTsmId(id);
    setTsmOfficeIds([]);
    if (!id) return;

    setLoadingTsmOffices(true);
    try {
      let officesRes = await getTsmOffices(id);

      const ids = Array.isArray(officesRes)
        ? officesRes
            .map((x: any) => {
              if (typeof x === "number") return x;
              if (typeof x === "string") {
                const found = offices.find((o) => o.name === x);
                return found ? found.id : Number.NaN;
              }
              if (x?.id !== undefined) return Number(x.id);
              return Number.NaN;
            })
            .filter((n: number) => !Number.isNaN(n))
        : [];

      setTsmOfficeIds(ids);
      setSavedTsmOfficeIds(ids.slice());
    } catch (e) {
      console.error("Failed to fetch TSM offices", e);
      toast.error("Unable to load TSM offices.");
    } finally {
      setLoadingTsmOffices(false);
    }
  };

  const handleAddOffice = (officeId: number) => {
    if (!selectedTsmId) return;
    setTsmOfficeIds((prev) => {
      if (prev.includes(officeId)) return prev;
      return [...prev, officeId];
    });
  };

  const handleRemoveOffice = (officeId: number) => {
    setTsmOfficeIds((prev) => prev.filter((id) => id !== officeId));
  };

  const handleSaveTsmOffices = async () => {
    if (!selectedTsmId) return;

    // Enforce at least one assigned office
    if (tsmOfficeIds.length === 0) {
      toast.error(
        "A Technical Staff Member must be assigned at least one office."
      );
      return;
    }

    // Avoid no-op saves
    if (savedTsmOfficeIds && equalSets(savedTsmOfficeIds, tsmOfficeIds)) {
      toast("No changes to save.");
      return;
    }

    setIsSavingTsm(true);
    try {
      const res = await updateTsmOffices(selectedTsmId, tsmOfficeIds);
      const successMsg = res?.message ?? "Technical staff offices updated.";
      toast.success(successMsg);

      // Refresh authoritative state from server (this also updates savedTsmOfficeIds)
      await handleSelectTsm(selectedTsmId);
    } catch (err: unknown) {
      console.error("Failed to update TSM offices", err);

      if (isApiError(err)) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update TSM offices.");
      }

      // Re-fetch to restore UI to server state
      try {
        await handleSelectTsm(selectedTsmId);
      } catch (e) {
        console.error("Failed to refresh TSM offices after error", e);
      }
    } finally {
      setIsSavingTsm(false);
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
    (form.userType !== "TECHNICAL_STAFF_MEMBER" ||
      form.officeIds.length !== 0) &&
    (form.userType !== "EXTERNAL_MAINTAINER" || form.companyId !== "");

  // Extract nested ternary into an independent statement to build the assigned offices content
  let assignedOfficesContent: React.ReactNode;
  if (loadingTsmOffices) {
    assignedOfficesContent = (
      <div className="text-muted">Loading assigned offices...</div>
    );
  } else if (tsmOfficeIds.length === 0) {
    assignedOfficesContent = (
      <div className="text-muted">No offices assigned.</div>
    );
  } else {
    assignedOfficesContent = tsmOfficeIds.map((oid) => {
      const office = offices.find((o) => o.id === oid);
      return (
        <motion.div
          key={oid}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="d-inline-block me-2 mb-2"
        >
          <Badge
            pill
            bg="secondary"
            className="tsm-badge d-inline-flex align-items-center"
            id={`tsm-office-${oid}`}
          >
            <span className="tsm-badge-label">
              {office ? office.name : `Office ${oid}`}
            </span>
            <Button
              variant="light"
              size="sm"
              onClick={() => handleRemoveOffice(oid)}
              id={`remove-office-${oid}`}
              className="ms-2 p-0 remove-office-btn d-inline-flex align-items-center justify-content-center"
              aria-label={`Remove office ${office ? office.name : oid}`}
              style={{ width: 22, height: 22, borderRadius: 999 }}
            >
              <XIcon size={12} />
            </Button>
          </Badge>
        </motion.div>
      );
    });
  }

  // Compute whether there are unsaved changes and the save button title
  const isTsmChanged = !savedTsmOfficeIds
    ? true
    : !equalSets(savedTsmOfficeIds, tsmOfficeIds);

  let saveButtonTitle = "Save changes";
  if (tsmOfficeIds.length === 0) {
    saveButtonTitle = "Assign at least one office to enable";
  } else if (isSavingTsm) {
    saveButtonTitle = "Saving...";
  } else if (!isTsmChanged) {
    saveButtonTitle = "No changes to save";
  }

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
      <Container className="my-4">
        <Row className="justify-content-md-center">
          <Col md={10} lg={10} xl={10}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <motion.h2
                className="text-center mb-4 auth-title"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Welcome, Admin {user?.firstName ?? ""} {user?.lastName ?? ""}
              </motion.h2>

              <Row className="mb-3 align-items-center flex-nowrap">
                <Col
                  xs={6}
                  md={selectedSection === "users" ? 8 : 4}
                  className={
                    selectedSection === "users"
                      ? "mb-2 mb-md-0 d-flex justify-content-center justify-content-md-center"
                      : "mb-2 mb-md-0 d-flex justify-content-center justify-content-md-start"
                  }
                >
                  <button
                    id="section-users-button"
                    className={`auth-link-inline section-btn ${
                      selectedSection === "users" ? "selected" : "muted"
                    }`}
                    onClick={() => setSelectedSection("users")}
                    aria-pressed={selectedSection === "users"}
                  >
                    Municipality Users Management
                  </button>
                </Col>
                <Col
                  xs={6}
                  md={selectedSection === "offices" ? 8 : 4}
                  className={
                    selectedSection === "offices"
                      ? "d-flex justify-content-center justify-content-md-center"
                      : "d-flex justify-content-center justify-content-md-end"
                  }
                >
                  <button
                    id="section-offices-button"
                    className={`auth-link-inline section-btn ${
                      selectedSection === "offices" ? "selected" : "muted"
                    } `}
                    onClick={() => setSelectedSection("offices")}
                    aria-pressed={selectedSection === "offices"}
                  >
                    Technical Offices Management
                  </button>
                </Col>
              </Row>

              <Card className="auth-card">
                <Card.Body>
                  {selectedSection === "users" && (
                    <>
                      <h4 className="mb-3 text-center">
                        Municipality Users Management
                      </h4>

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
                              value={
                                roleOptions.find(
                                  (o) => o.value === form.userType
                                ) ?? null
                              }
                              onChange={(
                                opt: SingleValue<{
                                  value: string;
                                  label: string;
                                }>
                              ) =>
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
                                  opts: MultiValue<{
                                    value: string;
                                    label: string;
                                  }>
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
                                value={
                                  companyOptions.find(
                                    (c) => c.value === form.companyId
                                  ) ?? null
                                }
                                onChange={(
                                  opt: SingleValue<{
                                    value: string;
                                    label: string;
                                  }>
                                ) =>
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
                                <div
                                  className="border rounded p-3"
                                  style={{ backgroundColor: "#f8f9fa" }}
                                >
                                  <Form.Group className="mb-3">
                                    <Form.Label>Company Name</Form.Label>
                                    <Form.Control
                                      id="new-company-name"
                                      type="text"
                                      placeholder="Enter company name"
                                      value={newCompanyName}
                                      onChange={(e) =>
                                        setNewCompanyName(e.target.value)
                                      }
                                      disabled={isCreatingCompany}
                                      className="auth-input"
                                    />
                                  </Form.Group>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Categories</Form.Label>
                                    <Select<
                                      { value: string; label: string },
                                      true
                                    >
                                      inputId="new-company-categories"
                                      instanceId="new-company-categories"
                                      options={categoryOptions}
                                      value={categoryOptions.filter((opt) =>
                                        newCompanyCategories.some(
                                          (cat) => String(cat.id) === opt.value
                                        )
                                      )}
                                      onChange={(
                                        opts: MultiValue<{
                                          value: string;
                                          label: string;
                                        }>
                                      ) => {
                                        const selectedCategories = opts.map(
                                          (opt) => {
                                            const cat = categories.find(
                                              (c) => String(c.id) === opt.value
                                            );
                                            return cat!;
                                          }
                                        );
                                        setNewCompanyCategories(
                                          selectedCategories
                                        );
                                      }}
                                      isMulti
                                      isDisabled={
                                        loadingCategories || isCreatingCompany
                                      }
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
                                          <Loader2Icon
                                            size={14}
                                            className="spin"
                                          />
                                          <span className="ms-1">
                                            Creating...
                                          </span>
                                        </>
                                      ) : (
                                        "Create Company"
                                      )}
                                    </Button>
                                    <Button
                                      id="cancel-company-button"
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        setShowNewCompanyForm(false);
                                        setNewCompanyName("");
                                        setNewCompanyCategories([]);
                                      }}
                                      disabled={isCreatingCompany}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
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
                            className={`w-100 mt-2 auth-button-primary`}
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
                                <Loader2Icon
                                  size={18}
                                  className="spin"
                                  aria-hidden="true"
                                />
                                <span>Creating…</span>
                              </>
                            ) : (
                              "Create Account"
                            )}
                          </Button>
                        </motion.div>
                      </Form>
                    </>
                  )}

                  {selectedSection === "offices" && (
                    <div className="mt-2">
                      <motion.h4
                        className="mb-3 text-center"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        Technical Offices Management
                      </motion.h4>
                      <Form className="d-flex flex-column auth-grid-gap">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12, duration: 0.4 }}
                        >
                          <Form.Group className="mb-3">
                            <Form.Label>Technical Staff Member</Form.Label>
                            <Select
                              inputId="select-tsm"
                              instanceId="select-tsm"
                              options={tsms.map((t) => ({
                                value: String(t.id),
                                label: t.name,
                              }))}
                              value={
                                selectedTsmId
                                  ? {
                                      value: String(selectedTsmId),
                                      label:
                                        tsms.find((t) => t.id === selectedTsmId)
                                          ?.name ?? "",
                                    }
                                  : null
                              }
                              onChange={(
                                opt: SingleValue<{
                                  value: string;
                                  label: string;
                                }>
                              ) => {
                                const id = opt ? Number(opt.value) : null;
                                handleSelectTsm(id);
                              }}
                              isDisabled={loadingTsms || tsms.length === 0}
                              placeholder={
                                loadingTsms ? "Loading TSMs..." : "Select a TSM"
                              }
                              components={{ Menu: AnimatedMenu }}
                              classNamePrefix="rs"
                            />
                          </Form.Group>
                        </motion.div>

                        {selectedTsmId && (
                          <>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.22, duration: 0.4 }}
                            >
                              <Form.Group className="mb-3">
                                <Form.Label>Assigned Offices</Form.Label>
                                <div>{assignedOfficesContent}</div>
                              </Form.Group>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.32, duration: 0.4 }}
                            >
                              <Form.Group className="mb-3">
                                <Form.Label>Add Office</Form.Label>
                                <Select
                                  inputId="select-add-office"
                                  instanceId="select-add-office"
                                  options={officeOptions.filter(
                                    (o) =>
                                      !tsmOfficeIds.includes(Number(o.value))
                                  )}
                                  value={null}
                                  onChange={(
                                    opt: SingleValue<{
                                      value: string;
                                      label: string;
                                    }>
                                  ) => {
                                    if (opt) handleAddOffice(Number(opt.value));
                                  }}
                                  isDisabled={
                                    offices.length === 0 ||
                                    loadingTsmOffices ||
                                    !selectedTsmId
                                  }
                                  placeholder={
                                    loadingTsmOffices
                                      ? "Loading offices..."
                                      : "Select office to add"
                                  }
                                  components={{
                                    Menu: AnimatedMenu,
                                    Option: OfficeOption,
                                  }}
                                  classNamePrefix="rs"
                                />
                              </Form.Group>
                            </motion.div>

                            {selectedTsmId !== null &&
                              !loadingTsmOffices &&
                              tsmOfficeIds.length === 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.42, duration: 0.3 }}
                                >
                                  <div className="text-danger small mb-2">
                                    A Technical Staff Member must be assigned at
                                    least one office.
                                  </div>
                                </motion.div>
                              )}

                            <motion.div
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.55, duration: 0.45 }}
                              className="d-flex justify-content-end gap-2"
                            >
                              <Button
                                id="save-tsm-offices"
                                variant="success"
                                onClick={handleSaveTsmOffices}
                                disabled={
                                  isSavingTsm ||
                                  tsmOfficeIds.length === 0 ||
                                  !isTsmChanged
                                }
                                aria-disabled={
                                  isSavingTsm ||
                                  tsmOfficeIds.length === 0 ||
                                  !isTsmChanged
                                }
                                title={saveButtonTitle}
                              >
                                {isSavingTsm ? (
                                  <>
                                    <Loader2Icon size={14} className="spin" />{" "}
                                    Saving...
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </Button>
                            </motion.div>
                          </>
                        )}
                      </Form>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

function equalSets(a: number[], b: number[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const v of sa) {
    if (!sb.has(v)) return false;
  }
  return true;
}
