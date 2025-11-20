import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';

interface Props {
    lat: number;
    long: number;
    zoom?: number;
    height?: number;
}

export default function ReportMiniMap({ lat, long, zoom = 16, height = 180 }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        if (mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [lat, long],
            zoom,
            zoomControl: true,
            dragging: false,
            scrollWheelZoom: 'center', // zoom sempre centrato
            doubleClickZoom: false,
            boxZoom: false,
            touchZoom: 'center',
            keyboard: false,
        });
        mapRef.current = map;

        try {
            new MaptilerLayer({ apiKey: "gb0u8xp4Dznehd1U110M" }).addTo(map);
        } catch (err) {
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(map);
            console.error("Maptiler failed, using OSM fallback", err);
        }

        const pin = L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });

        markerRef.current = L.marker([lat, long], { icon: pin }).addTo(map);

        setTimeout(() => {
            map.invalidateSize();
            map.setView([lat, long], map.getZoom(), { animate: false });
        }, 0);
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, long]);
        }
        mapRef.current.setView([lat, long], zoom, { animate: false });
    }, [lat, long, zoom]);

    return (
        <div style={{ width: "100%" }}>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #e0e0e0",
                    position: "relative",
                }}
            />
            <div
                style={{
                    fontSize: "1rem",
                    marginTop: 4,
                    color: "#555",
                    textAlign: "center",
                }}
            >
                Lat: {Number(lat).toFixed(5)} | Long: {Number(long).toFixed(5)}
            </div>
        </div>
    );
}
