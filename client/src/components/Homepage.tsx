import Map from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import { refreshUser } from "../api/api";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
};
interface UserData {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  image?: string;
  telegramUsername?: string;
  role: string;
  category?: string;
}

export default function HomePage({
  selected,
  setSelected,
  isLoggedIn,
  setIsLoggedIn,
  user,
  setUser
}: Props) {
  
  useAuth(user, setUser);

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
    const handleRefresh = async () => {
      if (localStorage.getItem("token") !== null) {
        const res = await refreshUser({
          token: localStorage.getItem("token")!,
        });
        if (res.status != 200) {
          setIsLoggedIn(false);
          setUser(null);
        } else {
          const data = res.data;
          const userId = data?.userId;
          const role = data?.role;
          setUser({ id: userId!, role: role! });
          setIsLoggedIn(true);
        }
      }
    };
    handleRefresh();
  }, [setIsLoggedIn, setUser]);

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
      {isLoggedIn && user?.role === "CITIZEN" && (
        <button
          type="button"
          className="center-action-button"
          aria-label="Create new report"
          onClick={() => navigate("/reports/new")}
        >
          + UPLOAD NEW REPORT
        </button>
      )}
      {isLoggedIn && user?.role === "ADMINISTRATOR" && (
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
