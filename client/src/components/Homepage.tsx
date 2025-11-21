import { HomepageMap } from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
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
      if(user){
        const fetchedReportsAssigned: Report[] = await getReportsByStatus(
          "Assigned"
        );
        const fetchedReportsInProgress: Report[] = await getReportsByStatus(
          "InProgress"
        );
        const fetchedReportsResolved: Report[] = await getReportsByStatus(
          "Resolved"
        );
        const fetchedReports = fetchedReportsAssigned
          .concat(fetchedReportsInProgress)
          .concat(fetchedReportsResolved);
        setReports(fetchedReports);
      } else {
        return;
      }
    };

    if(user) fetchReports();
    else setReports(null);
  }, [setReports, user]);

  return (
    <>
      <CustomNavbar />
      <Container fluid className="content p-0">
        <Row className="h-100 g-0">
          <Col xs={12} md={8} lg={9} className="h-100">
            <HomepageMap
              selected={selected}
              setSelected={setSelected}
              reports={reports}
            />
          </Col>
          <Col md={4} lg={3} className="d-none d-md-block h-100">
            {isLoggedIn ? (
              <ReportList />
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center px-3">
                <div className="text-center">
                  <h5 className="text-primary mb-2">Log in to report</h5>
                  <p className="mb-0">
                    You need to{" "}
                    <Link to="/login" id="login-2" className="text-primary">
                      log in
                    </Link>{" "}
                    to upload new reports or to existing ones.
                  </p>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
      {isLoggedIn && user?.userType === "CITIZEN" && (
        <button
          id="upload-new-report-button"
          type="button"
          className="center-action-button"
          aria-label="Create new report"
          onClick={() => navigate("/reports/new")}
        >
          + UPLOAD NEW REPORT
        </button>
      )}
      {isLoggedIn && user?.userType === "ADMINISTRATOR" && (
        <button
          id="go-to-admin-page-button"
          type="button"
          className="center-action-button-admin"
          aria-label="Create new report"
          onClick={() => navigate("/admin")}
        >
          GO TO ADMIN PAGE
        </button>
      )}
    </>
  );
}
