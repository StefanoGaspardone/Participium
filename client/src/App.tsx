import { useState } from "react";
import "./App.css";
import HomePage from "./components/Homepage";

function App() {
  // selected and setSelected are the two parameters (as props) that have to be passed to the Map component
  // selected contains fields "lat" and "lng" and setSelected allow to update their values
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    null
  );
  return (
    <>
      <HomePage selected={selected} setSelected={setSelected}></HomePage>
    </>
  );
}

export default App;
