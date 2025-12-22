import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Row, Col } from "react-bootstrap";
import { BsTelegram, BsXLg } from "react-icons/bs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HomepageMap } from "./HomepageMap";
import type { Coord, Report } from "../models/models";

type Props = Readonly<{
  reports: Report[] | null;
}>;

export default function NonLoggedHomepage({ reports }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMapModal, setShowMapModal] = useState<boolean>(
    Boolean(location.state?.showPublicMap)
  );
  const [selected, setSelected] = useState<Coord | null>(null);

  useEffect(() => {
    if (location.state?.showPublicMap) setShowMapModal(true);
  }, [location.state]);

  return (
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
            className="display-6 fw-bold"
            style={{ color: "#0067c6" }}
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
          Participium is a web application for{" "}
          <strong>citizen participation</strong> in the management of{" "}
          <strong>urban environments</strong>.
          <br />
          It enables citizens to interact with the public administration by{" "}
          <strong>reporting</strong> local issues such as 🕳️ potholes, ♿
          sidewalk barriers, 🗑️ trash on the streets, 💡 broken streetlights,
          and more.
        </p>
        <div className="mx-auto" style={{ maxWidth: 820 }}>
          <Row className="g-3 text-start justify-content-center">
            <Col sm={6}>
              <motion.div
                className="p-3 border rounded-3 h-100"
                style={{ background: "#ffffff" }}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <h6 className="fw-semibold mb-2">How it works</h6>
                <ul className="mb-0 ps-3">
                  <li>
                    📝 <strong>Register</strong> or log in to your account
                  </li>
                  <li>🗺️ Open the map and locate the affected area</li>
                  <li>
                    📷 Upload a report with <strong>photo</strong>,{" "}
                    <strong>location</strong>, and <strong>category</strong>
                  </li>
                  <li>
                    🔄 Track the status:{" "}
                    <strong>Assigned → In Progress → Resolved</strong>
                  </li>
                  <li>🔔 Receive notifications on updates</li>
                  <li>
                    <BsTelegram /> Link your Telegram account in Profile
                    settings to report and track issues via our{" "}
                    <a
                      href="https://t.me/ParticipiumSE05Bot"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      bot
                    </a>
                  </li>
                </ul>
              </motion.div>
            </Col>
            <Col sm={6}>
              <motion.div
                className="p-3 border rounded-3 h-100"
                style={{ background: "#ffffff" }}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <h6 className="fw-semibold mb-2">Who can report</h6>
                <p className="mb-0">
                  👤 Reports can be uploaded only by <strong>registered</strong>{" "}
                  citizens and only after <strong>logging in</strong>.
                </p>
                <h6 className="fw-semibold mt-3 mb-2">Who can see reports?</h6>
                <p className="mb-0">
                  👀 All users, including non-logged-in visitors, can view
                  reports on the map.{" "}
                  <button
                    id="open-public-map"
                    type="button"
                    className="auth-link-inline"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "#265ea8",
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                    onClick={() =>
                      navigate("/", { state: { showPublicMap: true } })
                    }
                  >
                    Open the map
                  </button>{" "}
                  to explore!
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
            <Link
              id="see-map"
              to="/"
              state={{ showPublicMap: true }}
              className="btn btn-outline-primary btn-lg me-3"
            >
              See map
            </Link>
          </motion.div>
          <motion.div
            style={{ display: "inline-block" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Link
              id="login-2"
              to="/login"
              className="btn btn-outline-warning btn-lg me-3"
            >
              Log In
            </Link>
          </motion.div>
          <motion.div
            style={{ display: "inline-block" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <Link
              id="register-redirect"
              to="/register"
              className="btn btn-outline-danger btn-lg"
            >
              Register
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showMapModal && (
          <motion.div
            className="public-map-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2050,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowMapModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{
                position: "relative",
                width: "90%",
                maxWidth: 1000,
                height: "75vh",
                background: "#fff",
                borderRadius: 12,
                overflow: "visible",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                zIndex: 2060,
              }}
            >
              <button
                id="close-public-map"
                aria-label="Chiudi mappa pubblica"
                title="Chiudi"
                onClick={() => setShowMapModal(false)}
                style={{
                  position: "absolute",
                  top: -14,
                  right: -15,
                  zIndex: 2070,
                  background: "#000",
                  border: "none",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  transition: "background-color 150ms ease",
                }}
              >
                <BsXLg size={20} aria-hidden="true" />
              </button>
              <div style={{ width: "100%", height: "100%" }}>
                <HomepageMap
                  selected={selected}
                  setSelected={setSelected}
                  reports={reports}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
