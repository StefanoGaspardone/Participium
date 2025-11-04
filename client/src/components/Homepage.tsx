import Map from "./HomepageMap";
import ReportList from "./ReportList";
import CustomNavbar from "./CustomNavbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      <div className="content">
        <Map selected={selected} setSelected={setSelected} />
        <ReportList />
      </div>
      <button
        type="button"
        className="center-action-button"
        aria-label="Create new report"
        onClick={() => navigate("/uploadReport")}
      >
        + UPLOAD NEW REPORT
      </button>
    </>
  );
}
