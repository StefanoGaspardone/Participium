import Map from "./Map";
import CustomNavbar from "./CustomNavbar";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord;
  setSelected: React.Dispatch<React.SetStateAction<Coord>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function HomePage({ selected, setSelected, isLoggedIn, setIsLoggedIn }: Props) {
  // ... rest of code ...
  return (
    <>
      <CustomNavbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Map selected={selected} setSelected={setSelected} />
    </>
  );
}
