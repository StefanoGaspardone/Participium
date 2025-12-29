import React, { useRef, useEffect, useState, useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Polygon,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./map.css";
import { useAppContext } from "../contexts/AppContext";
import type { Coord, Report } from "../models/models";
import { REPORT_STATUS_COLORS } from "../constants/reportStatusColors";
import { ChevronUp } from "lucide-react";
import { toast } from "react-hot-toast";

type PolygonCoords = number[][][];
type MultiPolygonCoords = number[][][][];

interface NominatimResult {
  geojson?:
    | { type: "Polygon"; coordinates: PolygonCoords }
    | { type: "MultiPolygon"; coordinates: MultiPolygonCoords };
}

const processGeoJsonBoundary = (results: NominatimResult[]): L.LatLng[][] => {
  const feature = results.find(
    (f) =>
      f.geojson &&
      (f.geojson.type === "Polygon" || f.geojson.type === "MultiPolygon")
  );
  if (!feature?.geojson) return [];

  const gj = feature.geojson;
  const polys: L.LatLng[][] = [];

  const convertToLatLng = (rawCoords: number[][]) =>
    rawCoords.map((pair) => L.latLng(pair[1], pair[0]));

  if (gj.type === "Polygon") {
    const rawOuter = gj.coordinates[0];
    polys.push(convertToLatLng(rawOuter));
  } else if (gj.type === "MultiPolygon") {
    const rawMulti = gj.coordinates;
    rawMulti.forEach((poly) => {
      const rawOuter = poly[0];
      polys.push(convertToLatLng(rawOuter));
    });
  }

  return polys;
};

const fetchAndProcessTurinBoundary = async (): Promise<L.LatLng[][]> => {
  const nominatimUrl =
    "https://nominatim.openstreetmap.org/search.php?q=Turin%2C+Italy&polygon_geojson=1&format=jsonv2";

  try {
    const response = await fetch(nominatimUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const results: NominatimResult[] = await response.json();
    return processGeoJsonBoundary(results);
  } catch (err) {
    console.error("Failed to load Turin boundary:", err);
    return [];
  }
};

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const pointInPolygon = (
  lat: number,
  long: number,
  polygon: L.LatLng[]
): boolean => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng,
      yi = polygon[i].lat;
    const xj = polygon[j].lng,
      yj = polygon[j].lat;

    const intersect =
      yi > lat !== yj > lat && long < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

const nearestOnSegment = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number; d2: number } => {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    const d2 = (px - x1) * (px - x1) + (py - y1) * (py - y1);
    return { x: x1, y: y1, d2 };
  }

  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))
  );
  const nx = x1 + t * dx;
  const ny = y1 + t * dy;
  const d2 = (px - nx) * (px - nx) + (py - ny) * (py - ny);

  return { x: nx, y: ny, d2 };
};

const nearestPointOnTurin = (
  lat: number,
  lng: number,
  polygon: L.LatLng[][]
): { lat: number; lng: number } | null => {
  if (!polygon.length) return null;

  let best: { x: number; y: number; d2: number } | null = null;
  for (const poly of polygon) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];

      const cand = nearestOnSegment(lng, lat, a.lng, a.lat, b.lng, b.lat);
      if (!best || cand.d2 < best.d2) best = cand;
    }
  }

  return best ? { lat: best.y, lng: best.x } : null;
};

type BaseProps = {
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
};

type HomepageMapProps = BaseProps & {
  reports?: Report[] | null;
};

export const fetchAddressByCoordinates = async (
  lat: number,
  lng: number
): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`
    );

    if (!res.ok) return "Not available";

    const data = await res.json();
    const road = data.address?.road || data.address?.pedestrian || "";
    const houseNumber = data.address?.house_number || "";
    const address = `${road} ${houseNumber}`.trim() || data.display_name || "";

    return address || "Not available";
  } catch (error) {
    console.error(error);
    return "Not available";
  }
};

export const fetchCoordinatesByAddress = async (
  address: string
): Promise<{ lat: number; lng: number } | null> => {
  try {
    const enhancedAddress = `${address}, Turin, Italy`;
    const query = encodeURIComponent(enhancedAddress);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&limit=5&countrycodes=it`
    );

    if (!res.ok) return null;

    const data = await res.json();

    if (data && data.length > 0) {
      const turinResults = data.filter((result: any) => {
        const lat = Number.parseFloat(result.lat);
        const lng = Number.parseFloat(result.lon);
        return lat >= 44.9 && lat <= 45.2 && lng >= 7.5 && lng <= 7.8;
      });

      if (turinResults.length > 0) {
        return {
          lat: Number.parseFloat(turinResults[0].lat),
          lng: Number.parseFloat(turinResults[0].lon),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error during geocoding:", error);
    return null;
  }
};

const LocationMarker = ({
  selected,
  setSelected,
  turinPolys,
}: {
  selected: Coord | null;
  setSelected: (c: Coord | null) => void;
  turinPolys: L.LatLng[][];
}) => {
  const { isLoggedIn } = useAppContext();
  const markerRef = useRef<L.Marker>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { pathname } = location;
  const showNewReportButton = pathname === "/";
  const goNewReport = React.useCallback(
    () => navigate("/reports/new"),
    [navigate]
  );

  useMapEvents({
    async click(e) {
      if (!isLoggedIn || !turinPolys.length) return;

      const { lat, lng } = e.latlng;
      const inside = turinPolys.some((poly) => pointInPolygon(lat, lng, poly));
      const snapped = inside
        ? { lat, lng }
        : nearestPointOnTurin(lat, lng, turinPolys);

      if (snapped) {
        setSelected({
          lat: snapped.lat,
          lng: snapped.lng,
          address: "Fetching address...",
        });
        const addr = await fetchAddressByCoordinates(snapped.lat, snapped.lng);
        setSelected({ lat: snapped.lat, lng: snapped.lng, address: addr });

        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.openPopup();
          }
        }, 100);
      }
    },
  });

  useEffect(() => {
    if (markerRef.current && selected) {
      setTimeout(() => {
        try {
          markerRef.current?.openPopup();
        } catch (err) {
          console.error("Failed to open marker popup:", err);
        }
      }, 100);
    }
  }, [selected]);

  return selected === null ? null : (
    <Marker position={[selected.lat, selected.lng]} ref={markerRef}>
      <Popup>
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <p
            style={{
              margin: "0 0 8px 0",
              fontWeight: 600,
              color: "#1e2a37",
              fontSize: "14px",
              lineHeight: 1.4,
            }}
          >
            {selected.address || "Not available"}
          </p>
          {showNewReportButton && (
            <button
              onClick={goNewReport}
              style={{
                background: "linear-gradient(135deg, #0057A0, #0066bb)",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                width: "100%",
                letterSpacing: "0.3px",
                boxShadow: "0 4px 12px rgba(0, 87, 160, 0.25)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(0, 87, 160, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 87, 160, 0.25)";
              }}
            >
              + New Report
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let color;
  let shadowColor;

  if (count < 10) {
    color = "#A5F3FC";
    shadowColor = "rgba(165, 243, 252, 0.5)";
  } else if (count < 25) {
    color = "#22D3EE";
    shadowColor = "rgba(34, 211, 238, 0.5)";
  } else if (count < 50) {
    color = "#06B6D4";
    shadowColor = "rgba(6, 182, 212, 0.5)";
  } else if (count < 100) {
    color = "#0891B2";
    shadowColor = "rgba(8, 145, 178, 0.5)";
  } else {
    color = "#164E63";
    shadowColor = "rgba(22, 78, 99, 0.5)";
  }

  return L.divIcon({
    html: `
            <div style='
                width: 44px;
                height: 44px;
                background: linear-gradient(135deg, ${color}EE, ${color}DD);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: rgba(255, 255, 255, 1);
                font-weight: 700;
                font-size: 15px;
                box-shadow: 0 4px 14px ${shadowColor}, 0 2px 6px rgba(0,0,0,0.2);
                border: 2.5px solid rgba(255, 255, 255, 0.4);
                transition: transform 0.25s ease, box-shadow 0.25s ease;
                backdrop-filter: blur(4px);
            '>${count}</div>
        `,
    className: "custom-cluster-icon",
    iconSize: L.point(50, 50, true),
  });
};

const sanitizeId = (value: string) =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

const createReportIcon = (status: string) => {
  const statusColor = REPORT_STATUS_COLORS[status] || "#6B7280";
  return L.divIcon({
    className: "custom-report-marker",
    html: `
            <div style='
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, ${statusColor}, ${statusColor}DD);
                border-radius: 50%;
                box-shadow: 0 3px 10px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.25);
                border: 2px solid rgba(255,255,255,0.5);
                transition: transform 0.2s ease;
            '></div>
        `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

const SearchBox = ({
  setSelected,
}: {
  setSelected: (c: Coord | null) => void;
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (formRef.current) {
      L.DomEvent.disableClickPropagation(formRef.current);
      L.DomEvent.disableScrollPropagation(formRef.current);
    }
  }, []);

  const onSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) {
      toast.error("Please enter an address");
      return;
    }

    setLoading(true);
    try {
      const coords = await fetchCoordinatesByAddress(q);
      if (!coords) {
        toast.error("No address found");
        return;
      }

      setSelected({ lat: coords.lat, lng: coords.lng, address: q });
    } catch (err) {
      console.error(err);
      toast.error("No address found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      className="map-search-container"
      onSubmit={onSearch}
      ref={formRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <label htmlFor="map-search-input" className="visually-hidden">
        Search address
      </label>
      <div className="map-search-input-wrapper">
        <motion.input
          id="map-search-input"
          className="map-search-input"
          placeholder="Search address in Turin..."
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete="off"
          aria-label="Search address"
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      </div>
      <motion.button
        type="submit"
        className="map-search-btn"
        disabled={loading}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {loading ? <span className="search-spinner" /> : "Search"}
      </motion.button>

      <AnimatePresence>
        {query && (
          <motion.button
            type="button"
            className="map-search-clear"
            onClick={() => {
              setQuery("");
              setSelected(null);
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        )}
      </AnimatePresence>
    </motion.form>
  );
};

const MapUpdater = ({ position }: { position: Coord | null }) => {
  const map = useMap();
  const prevPosition = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!position) {
      prevPosition.current = null;
      return;
    }

    const isSamePosition =
      prevPosition.current &&
      Math.abs(prevPosition.current.lat - position.lat) < 0.0000001 &&
      Math.abs(prevPosition.current.lng - position.lng) < 0.0000001;

    if (isSamePosition) return;

    prevPosition.current = { lat: position.lat, lng: position.lng };

    try {
      map.flyTo([position.lat, position.lng], 17, {
        animate: true,
        duration: 1.2,
      });
    } catch (error) {
      console.error("Error in flyTo:", error);
      try {
        map.setView([position.lat, position.lng], 17);
      } catch (e) {
        console.error("Error in setView fallback:", e);
      }
    }
  }, [position, map]);

  return null;
};

export default function MapDefault(props: Readonly<BaseProps>) {
  const { selected, setSelected } = props;
  const center = { lat: 45.06985, lng: 7.68228 };
  const zoom = 12;
  const [turinPolys, setTurinPolys] = useState<L.LatLng[][]>([]);

  useEffect(() => {
    fetchAndProcessTurinBoundary().then(setTurinPolys);
  }, []);

  return (
    <div id="map-container" className="map-wrap">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {turinPolys.length > 0 && (
          <Polygon
            positions={turinPolys}
            pathOptions={{ color: "#0057A0", weight: 4, fillOpacity: 0 }}
          />
        )}
        <MapUpdater position={selected} />
        <LocationMarker
          selected={selected}
          setSelected={setSelected}
          turinPolys={turinPolys}
        />
      </MapContainer>
    </div>
  );
}

export function HomepageMap({
  selected,
  setSelected,
  reports,
}: Readonly<HomepageMapProps>) {
  const center = { lat: 45.06985, lng: 7.68228 };
  const zoom = 13;

  const [turinPolys, setTurinPolys] = useState<L.LatLng[][]>([]);
  const [legendOpen, setLegendOpen] = useState(false);

  const statusEntries = useMemo(
    () =>
      Object.entries(REPORT_STATUS_COLORS).filter(
        ([status]) => status !== "Pending"
      ),
    []
  );

  const legendPanelId = useId();
  const legendBaseId = useMemo(
    () => `map-legend-${legendPanelId.replaceAll(/[^a-zA-Z0-9]/g, "")}`,
    [legendPanelId]
  );
  const legendContainerId = `${legendBaseId}-container`;
  const legendToggleId = `${legendBaseId}-toggle`;
  const legendListId = `${legendBaseId}-list`;

  useEffect(() => {
    fetchAndProcessTurinBoundary().then(setTurinPolys);
  }, []);

  return (
    <div id="map-container" className="map-wrap">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {turinPolys.length > 0 && (
          <Polygon
            positions={turinPolys}
            pathOptions={{ color: "#0057A0", weight: 4, fillOpacity: 0 }}
          />
        )}
        <MapUpdater position={selected} />
        <LocationMarker
          selected={selected}
          setSelected={setSelected}
          turinPolys={turinPolys}
        />
        <SearchBox setSelected={setSelected} />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={80}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {reports?.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.long]}
              icon={createReportIcon(report.status)}
            >
              <Popup>
                <div style={{ textAlign: "center", padding: "4px 0" }}>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontWeight: 600,
                      color: "#1e2a37",
                      fontSize: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    {report.title}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#6c7a89",
                      fontWeight: 500,
                    }}
                  >
                    Issued by:{" "}
                    <span style={{ color: "#0057A0" }}>
                      {report.anonymous
                        ? "Anonymous"
                        : `@${report.createdBy?.username || "Unknown"}`}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      <motion.div
        id={legendContainerId}
        className="map-legend"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <motion.button
          type="button"
          id={legendToggleId}
          className="map-legend-toggle"
          onClick={() => setLegendOpen((prev) => !prev)}
          aria-expanded={legendOpen}
          aria-controls={legendPanelId}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="map-legend-title-block" id={`${legendBaseId}-title`}>
            <span className="map-legend-title">Report Status Colours</span>
          </div>
          <motion.span
            id={`${legendBaseId}-caret`}
            className={`map-legend-caret ${legendOpen ? "open" : ""}`}
            aria-hidden="true"
            animate={{ rotate: legendOpen ? 0 : -180 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ChevronUp size={16} />
          </motion.span>
        </motion.button>
        <AnimatePresence initial={false}>
          {legendOpen && (
            <motion.div
              key="map-legend-body"
              id={legendPanelId}
              className="map-legend-body"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ul id={legendListId} className="map-legend-list">
                {statusEntries.map(([status, color], index) => {
                  const rowId = `${legendBaseId}-status-${sanitizeId(status)}`;

                  return (
                    <motion.li
                      id={rowId}
                      key={status}
                      className="map-legend-row"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <span
                        id={`${rowId}-swatch`}
                        className="map-legend-color"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      ></span>
                      <div className="map-legend-labels">
                        <span
                          id={`${rowId}-label`}
                          className="map-legend-status"
                        >
                          {status}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
