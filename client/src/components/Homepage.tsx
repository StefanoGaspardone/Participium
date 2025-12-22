import { HomepageMap } from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import Chats from "./Chats";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NonLoggedHomepage from "./NonLoggedHomepage";
import { Container, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import { useAppContext } from "../contexts/AppContext";
import type { Coord, Report } from "../models/models";
import { getReportsByStatus } from "../api/api";

type Props = Readonly<{
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
}>;

export default function HomePage({ selected, setSelected }: Props) {
  const { user, isLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[] | null>(null);

  // Chats state
  const [showChats, setShowChats] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [chatTargetUserId, setChatTargetUserId] = useState<number | null>(null);

  const handleToggleChats = () => setShowChats((prev) => !prev);
  const handleOpenChat = (r: Report, targetUserId?: number | null) => {
    setChatTargetUserId(targetUserId ?? null);
    setActiveReport(r);
    setShowChats(true);
  };

  // Open chat when coming from notifications navigate state
  const location = useLocation();
  type NavState = {
    openChat?: { report?: Partial<Report>; targetUserId?: number | null };
  };
  useEffect(() => {
    const payload = (location.state as NavState)?.openChat;
    if (!payload) return;

    const reportObj = payload.report ? (payload.report as Report) : null;
    handleOpenChat(
      reportObj ??
        ({
          id: payload.report?.id,
          title: payload.report?.title,
        } as unknown as Report),
      payload.targetUserId ?? null
    );

    // Clear location state so it doesn't re-trigger on navigation
    if (globalThis?.history?.replaceState)
      globalThis.history.replaceState({}, document.title);
  }, [location]);

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
      try {
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
      } catch (e) {
        console.error("Failed to fetch reports:", e);
        setReports([]);
      }
    };
    fetchReports();
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
          <NonLoggedHomepage reports={reports} />
        )}
      </Container>

      {/* Chats (Citizen homepage) */}
      {isLoggedIn && (
        <Chats
          show={showChats}
          handleToggle={handleToggleChats}
          activeReport={activeReport}
          setActiveReport={setActiveReport}
          targetUserId={chatTargetUserId}
        />
      )}

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
