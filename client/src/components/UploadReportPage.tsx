import CustomNavbar from "./CustomNavbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Map from "./HomepageMap";
import { Form, Button } from "react-bootstrap";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord;
  setSelected: React.Dispatch<React.SetStateAction<Coord>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function UploadReport({
  selected,
  setSelected,
  isLoggedIn,
  setIsLoggedIn,
}: Props) {
  const navigate = useNavigate();
  {
    /** in "selected" lat e lng are contained and they're initially the ones selected in the homepage from the user before clicking on upload button*/
  }
  return (
    <>
      <CustomNavbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <main className="upload-container">
            <button
          type="button"
          className="left-back-button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          ← Home
        </button>
        <section className="upload-map">
          <div className="main-area">
            <Map selected={selected} setSelected={setSelected} />
          </div>
        </section>

        <section className="upload-form">
          <Form>
            <Form.Group>
              <Form.Label> Latitude </Form.Label>
              <Form.Control
                type="text"
                placeholder=""
                defaultValue={selected?.lat}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label> Longitude </Form.Label>
              <Form.Control
                type="text"
                placeholder=""
                defaultValue={selected?.lng}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Campo</Form.Label>
              <Form.Control type="text" placeholder="" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Campo</Form.Label>
              <Form.Control type="text" placeholder="" />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Upload
            </Button>
          </Form>
        </section>
      </main>
    </>
  );
}
