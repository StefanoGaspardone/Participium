import { HomepageMap } from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import { useAppContext } from "../contexts/AppContext";
import type { Coord, Report } from "../models/models";
import { getReportsByStatus } from "../api/api";

type Props = {
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
};

export default function HomePage({ selected, setSelected }: Props) {
  const { user, isLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[] | null>(null);

  useEffect(() => {
    const nav = document.querySelector(".navbar");
    if (nav instanceof HTMLElement) {
      const h = nav.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--navbar-height", `${h}px`);
    }
    return () => {
      document.documentElement.style.removeProperty("--navbar-height");
    };
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      if (user) {
        const fetchedReportsAssigned: Report[] = await getReportsByStatus(
          "Assigned"
        );
        const fetchedReportsInProgress: Report[] = await getReportsByStatus(
          "InProgress"
        );
        const fetchedReportsSuspended: Report[] = await getReportsByStatus(
          "Suspended"
        );
        const fetchedReportsResolved: Report[] = await getReportsByStatus(
          "Resolved"
        );
        const fetchedReports = fetchedReportsAssigned
          .concat(fetchedReportsInProgress)
          .concat(fetchedReportsSuspended)
          .concat(fetchedReportsResolved);
        setReports(fetchedReports);
      } else {
        return;
      }
    };

    if (user) fetchReports();
    else setReports(null);
  }, [setReports, user]);

  return (
    <>
      <CustomNavbar />
      <Container fluid className="content p-0">
        {isLoggedIn ? (
          <Row className="h-100 g-0">
            <Col xs={12} md={8} lg={9} className="h-100">
              <HomepageMap
                selected={selected}
                setSelected={setSelected}
                reports={reports}
              />
            </Col>
            <Col md={4} lg={3} className="d-none d-md-block h-100">
              <ReportList />
            </Col>
          </Row>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center text-center"
            style={{
              minHeight: "calc(100vh - var(--navbar-height, 56px))",
              background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
            }}
          >
            <motion.div
              className="px-4 py-5"
              style={{
                maxWidth: 960,
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(6px)",
                borderRadius: 16,
                boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <motion.div
                initial="rest"
                whileHover="hover"
                animate="rest"
                style={{ display: "inline-block" }}
              >
                <motion.h1
                  className="display-6 fw-bold mb-3"
                  style={{ color: "#0d6efd" }}
                  variants={{ rest: { scale: 1 }, hover: { scale: 1.02 } }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                >
                  Participium
                </motion.h1>
                <motion.div
                  style={{
                    height: 2,
                    backgroundColor: "#0d6efd",
                    borderRadius: 2,
                    transformOrigin: "left",
                  }}
                  variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                />
              </motion.div>
              <p className="lead mb-4 px-2">
                Participium is a web application for <strong>citizen participation</strong> in the
                management of <strong>urban environments</strong>.<br />
                It enables citizens to interact with the public administration by <strong>reporting </strong>
                local issues such as 🕳️ potholes, ♿ sidewalk barriers, 🗑️ trash on the streets,
                💡 broken streetlights, and more.
              </p>
              <div className="mx-auto" style={{ maxWidth: 820 }}>
                <Row className="g-3 text-start justify-content-center">
                  <Col sm={6}>
                    <motion.div
                      className="p-3 border rounded-3 h-100"
                      style={{ background: "#ffffff" }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <h6 className="fw-semibold mb-2">How it works</h6>
                      <ul className="mb-0 ps-3">
                        <li>📝 <strong>Register</strong> or log in to your account</li>
                        <li>🗺️ Open the map and locate the affected area</li>
                        <li>📷 Upload a report with <strong>photo</strong>, <strong>location</strong>, and <strong>category</strong></li>
                        <li>🔄 Track the status: <strong>Assigned → In Progress → Resolved</strong></li>
                        <li>🔔 Receive notifications on updates</li>
                      </ul>
                    </motion.div>
                  </Col>
                  <Col sm={6}>
                    <motion.div
                      className="p-3 border rounded-3 h-100"
                      style={{ background: "#ffffff" }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <h6 className="fw-semibold mb-2">Who can report</h6>
                      <p className="mb-0">
                        👤 Reports can be uploaded only by <strong>registered</strong> citizens and
                        only after <strong>logging in</strong>.
                      </p>
                    </motion.div>
                  </Col>
                </Row>
              </div>
              <div className="mt-4">
                <motion.div
                  style={{ display: "inline-block" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <Link id = "login-2" to="/login" className="btn btn-warning btn-lg me-3">
                    Log In
                  </Link>
                </motion.div>
                <motion.div
                  style={{ display: "inline-block" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <Link id="register-redirect" to="/register" className="btn btn-outline-primary btn-lg ">
                    Register
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </Container>
      {isLoggedIn && user?.userType === "CITIZEN" && (
        <motion.button
          id="upload-new-report-button"
          type="button"
          className="center-action-button btn btn-primary"
          aria-label="Create new report"
          onClick={() => navigate("/reports/new")}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95, y: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
        >
          + Upload New Report
        </motion.button>
      )}
    </>
  );
}
