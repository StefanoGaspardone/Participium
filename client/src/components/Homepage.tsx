import Map from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useAppContext } from "../contexts/AppContext";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
};

export default function HomePage({
  selected,
  setSelected, }: Props) {

  const { user, isLoggedIn } = useAppContext();
  const navigate = useNavigate();

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

  return (
    <>
      <CustomNavbar />
      <Container fluid className="content">
        <Row className="h-100 g-0">
          <Col xs={12} md={8} lg={9} className="h-100">
            <Map selected={selected} setSelected={setSelected} />
          </Col>
          <Col md={4} lg={3} className="d-none d-md-block h-100">
            {isLoggedIn ? (
              <ReportList />
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center px-3">
                <div className="text-center">
                  <h5 className="text-primary mb-2">Log in to report</h5>
                  <p className="mb-0">You need to <Link to="/login" className="text-primary">log in</Link> to upload new reports.</p>
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
