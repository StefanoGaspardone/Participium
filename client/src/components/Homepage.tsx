import Map from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useAppContext } from "../contexts/AppContext";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
};

export default function HomePage({
  selected,
  setSelected,}: Props) {
  
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
      <CustomNavbar/>
      <Container fluid className="content">
        <Row className="h-100 g-0 bg-primary">
          <Col xs={12} md={8} lg={9} className="h-100">
            <Map selected={selected} setSelected={setSelected} />
          </Col>
          <Col md={4} lg={3} className="d-none d-md-block h-100">
            <ReportList />
          </Col>
        </Row>
      </Container>
      {isLoggedIn && user?.userType === "CITIZEN" && (
        <button
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
