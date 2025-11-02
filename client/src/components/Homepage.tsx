import Map from "./Map";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord;
  setSelected: React.Dispatch<React.SetStateAction<Coord>>;
};

export default function HomePage({ selected, setSelected }: Props) {
  // ... rest of code ...
  return (<Map selected={selected} setSelected={setSelected} />);
}
