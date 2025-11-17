import React, { useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import "./map.css";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import { useAppContext } from "../contexts/AppContext";

type Coord = { lat: number; lng: number } | null;

type Props = {
  selected: Coord;
  setSelected: React.Dispatch<React.SetStateAction<Coord>>;
};

export default function Map({ selected, setSelected }: Props) {
  const { isLoggedIn } = useAppContext();

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<leaflet.Map | null>(null);

  const markerRef = useRef<leaflet.Marker | null>(null);

  const center = { lat: 45.06985, lng: 7.68228 };
  const zoom = 14;

  useEffect(() => {
    if (selected) {
      console.log("NEW COORDS : " + JSON.stringify(selected));
    }
  }, [selected]);

  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once
    if (!mapContainer.current) return; // if doesn't exist stops

    map.current = new leaflet.Map(mapContainer.current, {
      center: leaflet.latLng(center.lat, center.lng),
      zoom: zoom,
    });

    // Create a MapTiler Layer inside Leaflet
    new MaptilerLayer({ apiKey: "gb0u8xp4Dznehd1U110M" }).addTo(map.current);

  }, [center.lng, center.lat, zoom, setSelected]);

  // attach click listener in a separate effect so the handler closes over latest isLoggedIn
  useEffect(() => {
    if (!map.current) return;

    const onClick = (e: leaflet.LeafletMouseEvent) => {
      if (!isLoggedIn) return;

      const { lat, lng } = e.latlng;
      const newCoords = { lat, lng };
      setSelected(newCoords);

      if (!map.current) return;
      if (!markerRef.current) {
        markerRef.current = leaflet.marker([lat, lng]).addTo(map.current);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
    };

    map.current.on("click", onClick);
    return () => {
      map.current?.off("click", onClick);
    };
  }, [isLoggedIn, setSelected]);

  useEffect(() => {
    if (!map.current || !selected) return;
    const { lat, lng } = selected;
    if (!markerRef.current) {
      markerRef.current = leaflet.marker([lat, lng]).addTo(map.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    map.current.setView([lat, lng], map.current.getZoom());
  }, [selected]);

  return (
    <div className="map-wrap">
      {isLoggedIn && (
        <div className = 'map-coords-top' aria-live="polite">
          {selected ? (
            <span id="selected-location">
              Selected location: ({selected.lat}, {selected.lng})
            </span>
          ) : (
            <span id="selected-location" style={{ opacity: 0.7 }}>Click on the map to pick a location</span>
          )}
        </div>
      )}

      <div ref={mapContainer} id="map-container" className="map" />
    </div>
  );
}
