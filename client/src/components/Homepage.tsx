import Map from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord;
  setSelected: React.Dispatch<React.SetStateAction<Coord>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function HomePage({
  selected,
  setSelected,
  isLoggedIn,
  setIsLoggedIn,
}: Props) {
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

  const navigate = useNavigate();

  return (
    <>
      <CustomNavbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
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
      {isLoggedIn && (
        <button type = "button" className = "center-action-button" aria-label = "Create new report" onClick = { () => navigate("/reports/new") }>
          + UPLOAD NEW REPORT
        </button>
      )}
      
    </>
  );
}
