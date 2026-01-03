import { useState } from "react";
import { Container, Card, Alert, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import CustomNavbar from "./CustomNavbar";
import { useAppContext } from "../contexts/AppContext";
import "./AuthForms.css";
import {
  useAdminData,
  UsersManagementSection,
  TechnicalOfficesSection,
} from "./admin";

// Re-export for backwards compatibility
export { SelectOption, RoleOption, OfficeOption, CompanyOption } from "./admin";

export default function AdminHomepage() {
  const { user } = useAppContext();
  const [selectedSection, setSelectedSection] = useState<"users" | "offices">(
    "users"
  );

  const {
    offices,
    companies,
    categories,
    tsms,
    loadingOffices,
    loadingCompanies,
    loadingCategories,
    loadingTsms,
    refreshCompanies,
  } = useAdminData();

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

              <SectionTabs
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
              />

              <Card className="auth-card">
                <Card.Body>
                  {selectedSection === "users" && (
                    <UsersManagementSection
                      offices={offices}
                      companies={companies}
                      categories={categories}
                      loadingOffices={loadingOffices}
                      loadingCompanies={loadingCompanies}
                      loadingCategories={loadingCategories}
                      refreshCompanies={refreshCompanies}
                    />
                  )}

                  {selectedSection === "offices" && (
                    <TechnicalOfficesSection
                      offices={offices}
                      tsms={tsms}
                      loadingTsms={loadingTsms}
                    />
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

interface SectionTabsProps {
  selectedSection: "users" | "offices";
  onSelectSection: (section: "users" | "offices") => void;
}

function SectionTabs({ selectedSection, onSelectSection }: SectionTabsProps) {
  return (
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
          onClick={() => onSelectSection("users")}
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
          onClick={() => onSelectSection("offices")}
          aria-pressed={selectedSection === "offices"}
        >
          Technical Offices Management
        </button>
      </Col>
    </Row>
  );
}
