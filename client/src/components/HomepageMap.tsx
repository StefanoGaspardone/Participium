import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./map.css";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import { useAppContext } from "../contexts/AppContext";
import type { Coord, Report } from "../models/models";

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const pointInPolygon = (lat: number, long: number, polygon: L.LatLng[]): boolean => {
	let inside = false;
	
	for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].lng, yi = polygon[i].lat;
		const xj = polygon[j].lng, yj = polygon[j].lat;
      
		const intersect = yi > lat !== yj > lat && long < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

      	if(intersect) inside = !inside;
    }

    return inside;
}

const nearestOnSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): { x: number; y: number; d2: number } => {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if(dx === 0 && dy === 0) {
		const d2 = (px - x1) * (px - x1) + (py - y1) * (py - y1);
		return { x: x1, y: y1, d2 };
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const nx = x1 + t * dx;
    const ny = y1 + t * dy;
    const d2 = (px - nx) * (px - nx) + (py - ny) * (py - ny);

    return { x: nx, y: ny, d2 };
}

const nearestPointOnTurin = (lat: number, lng: number, polygon: L.LatLng[][]): { lat: number; lng: number } | null => {
	if(!polygon.length) return null;
	
	let best: { x: number; y: number; d2: number } | null = null;
	for(const poly of polygon) {
		for(let i = 0; i < poly.length; i++) {
			const a = poly[i];
			const b = poly[(i + 1) % poly.length];
			
			const cand = nearestOnSegment(lng, lat, a.lng, a.lat, b.lng, b.lat);
			if(!best || cand.d2 < best.d2) best = cand;
    	}
  	}
  
	return best ? { lat: best.y, lng: best.x } : null;
}

type Props = {
	selected: Coord | null;
	setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
	reports?: Report[] | null;
};

// Map component WITHOUT the markers' cluster feature (just the feature to select a point on the map)
export default function Map({ selected, setSelected }: Props) {
	const { isLoggedIn } = useAppContext();

	const mapContainer = useRef<HTMLDivElement | null>(null);
	const map = useRef<L.Map | null>(null);

	const markerRef = useRef<L.Marker | null>(null);

	const center = { lat: 45.06985, lng: 7.68228 };
	const zoom = 14;

	useEffect(() => {
		if(selected) {
			console.log("NEW COORDS : " + JSON.stringify(selected));
		}
	}, [selected]);

  	const turinPolysRef = useRef<L.LatLng[][]>([]);

	useEffect(() => {
		if(map.current) return;
		if(!mapContainer.current) return;
		
		map.current = new L.Map(mapContainer.current, {
			center: L.latLng(center.lat, center.lng),
			zoom: zoom,
			minZoom: 11,
			maxZoom: 18,
		});

    	new MaptilerLayer({ apiKey: "gb0u8xp4Dznehd1U110M" }).addTo(map.current);
		
		const nominatimUrl = "https://nominatim.openstreetmap.org/search.php?q=Turin%2C+Italy&polygon_geojson=1&format=jsonv2";
		
		type PolygonCoords = number[][][];
		type MultiPolygonCoords = number[][][][];
		interface NominatimResult {
			geojson?: | { type: "Polygon"; coordinates: PolygonCoords } | { type: "MultiPolygon"; coordinates: MultiPolygonCoords };
		}
		
		fetch(nominatimUrl)
			.then(r => r.json())
			.then((results: NominatimResult[]) => {
				const feature = results.find(f => f.geojson && (f.geojson.type === "Polygon" || f.geojson.type === "MultiPolygon"));
				if(!feature || !feature.geojson) throw new Error("No polygon found for Turin");
        		
				const gj = feature.geojson;
				const holes: [number, number][][] = [];
        	
				if(gj && gj.type === "Polygon") {
					const rawOuter = (gj.coordinates as PolygonCoords)[0];
					const outer: [number, number][] = rawOuter.map((pair) => {
						const [lng, lat] = pair as [number, number];
						return [lat, lng];
          			});
					
					holes.push(outer.slice().reverse());
					turinPolysRef.current = [
						outer.map((pair: [number, number]) => L.latLng(pair[0], pair[1])),
					];
        		} else if(gj && gj.type === "MultiPolygon") {
					const rawMulti = gj.coordinates as MultiPolygonCoords;
					const polys: L.LatLng[][] = [];
			
					rawMulti.forEach((poly) => {
						const rawOuter = poly[0];
						const outer: [number, number][] = rawOuter.map((pair) => {
							const [lng, lat] = pair as [number, number];
							return [lat, lng];
            			});

						holes.push(outer.slice().reverse());
						polys.push(outer.map((pair) => L.latLng(pair[0], pair[1])));
					});

					turinPolysRef.current = polys;
				}
				
				const borderLayer = L
					.geoJSON(gj as unknown as GeoJSON.GeoJsonObject, {
						style: { color: "#0057A0", weight: 4, fillOpacity: 0 },
					})
					.addTo(map.current!);
				
				map.current!.fitBounds(borderLayer.getBounds(), { padding: [20, 20] });
      		})
      		.catch((err) => console.error("Failed to load Turin boundary:", err));
  	}, [center.lng, center.lat, zoom, setSelected]);

  useEffect(() => {
    if (!map.current) return;

    const onClick = async (e: L.LeafletMouseEvent) => {
      if (!isLoggedIn) return;
      if (!turinPolysRef.current.length) return;

      const { lat, lng } = e.latlng;
      const inside = turinPolysRef.current.some((poly) =>
        pointInPolygon(lat, lng, poly)
      );
      const snapped = inside ? { lat, lng } : nearestPointOnTurin(lat, lng, turinPolysRef.current);
      if (!snapped) return;

	  const address = await fetchAddress(lat, lng);

      setSelected({ ...snapped, address });

      if (!map.current) return;
      if (!markerRef.current) {
        markerRef.current = L
          .marker([snapped.lat, snapped.lng])
          .addTo(map.current);
      } else {
        markerRef.current.setLatLng([snapped.lat, snapped.lng]);
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
      markerRef.current = L.marker([lat, lng]).addTo(map.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    map.current.setView([lat, lng], map.current.getZoom());
  }, [selected]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}

const fetchAddress = async (lat: number, lng: number): Promise<string> => {
	try {
		const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`);
		
		if(!res.ok) return 'Not available';
		
		const data = await res.json();
		const road = data.address?.road || data.address?.pedestrian || "";
		const houseNumber = data.address?.house_number || "";
		const address = `${road} ${houseNumber}`.trim() || data.display_name || "";

    	return address || 'Not available';
	} catch(error) {
		console.error(error);
		return 'Not available';
	}
}

function LocationMarker({ selected, setSelected, turinPolys }: { selected: Coord | null, setSelected: (c: Coord | null) => void, turinPolys: L.LatLng[][] }) {
    const { isLoggedIn } = useAppContext();
    const navigate = useNavigate();

    const map = useMap();
    
	const markerRef = useRef<L.Marker>(null);
    
	const [address, setAddress] = useState<string>("");

    useMapEvents({
        click(e) {
            if(!isLoggedIn || !turinPolys.length) return;

            const { lat, lng } = e.latlng;
            const inside = turinPolys.some((poly) => pointInPolygon(lat, lng, poly));
            const snapped = inside ? { lat, lng } : nearestPointOnTurin(lat, lng, turinPolys);

            if(snapped) setSelected({ lat: snapped.lat, lng: snapped.lng });
        }
    });

    useEffect(() => {
        if(selected) {
            if(!selected.address) {
                 setAddress("Fetching address...");
                 fetchAddress(selected.lat, selected.lng).then(addr => {
                     setAddress(addr);
                     setSelected({ ...selected, address: addr });
                 });
            } else {
                setAddress(selected.address);
            }
        }
    }, [selected, setSelected]);

    useEffect(() => {
        if(selected && markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [selected, address]);

    useEffect(() => {
        if(selected) {
            map.flyTo([selected.lat, selected.lng], map.getZoom());
        }
    }, [selected, map]);

    return selected === null ? null : (
        <Marker position={[selected.lat, selected.lng]} ref={markerRef}>
            <Popup>
                <div style={{ textAlign: "center" }}>
                    <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>{address || "Not available"}</p>
                    <button
                            onClick={() => navigate("/reports/new")}
                            style={{
                                backgroundColor: "#0057A0",
                                color: "white",
                                border: "none",
                                padding: "5px 5px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                width: "100%"
                            }}
                        >
                            + New Report
                        </button>
                </div>
            </Popup>
        </Marker>
    );
}

// Map component WITH the markers' cluster feature and the other ones
export function HomepageMap({ selected, setSelected, reports }: Props) {
    const center = { lat: 45.06985, lng: 7.68228 };
    const zoom = 12;
    const [turinPolys, setTurinPolys] = useState<L.LatLng[][]>([]);

    useEffect(() => {
        const nominatimUrl = "https://nominatim.openstreetmap.org/search.php?q=Turin%2C+Italy&polygon_geojson=1&format=jsonv2";
        
        type PolygonCoords = number[][][];
        type MultiPolygonCoords = number[][][][];
        interface NominatimResult {
            geojson?: | { type: "Polygon"; coordinates: PolygonCoords } | { type: "MultiPolygon"; coordinates: MultiPolygonCoords };
        }

        fetch(nominatimUrl)
            .then(r => r.json())
            .then((results: NominatimResult[]) => {
                const feature = results.find(f => f.geojson && (f.geojson.type === "Polygon" || f.geojson.type === "MultiPolygon"));
                if (!feature || !feature.geojson) return;

                const gj = feature.geojson;
                const polys: L.LatLng[][] = [];

                if (gj.type === "Polygon") {
                    const rawOuter = (gj.coordinates as PolygonCoords)[0];
                    polys.push(rawOuter.map((pair) => L.latLng(pair[1], pair[0])));
                } else if (gj.type === "MultiPolygon") {
                    const rawMulti = gj.coordinates as MultiPolygonCoords;
                    rawMulti.forEach((poly) => {
                        const rawOuter = poly[0];
                        polys.push(rawOuter.map((pair) => L.latLng(pair[1], pair[0])));
                    });
                }
                setTurinPolys(polys);
            })
            .catch(err => console.error("Failed to load Turin boundary:", err));
    }, []);

    return (
        <div className="map-wrap">
            <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={true} className="map">
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
                
                <LocationMarker selected={selected} setSelected={setSelected} turinPolys={turinPolys} />

                {reports && reports.map((report) => (
                    <Marker key={report.id} position={[report.lat, report.long]}>
                        <Popup>{report.title}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
