import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

interface ReportMiniMapProps {
    lat: number;
    long: number;
}

function MapResizer() {
    const map = useMap();

    useEffect(() => {
        const timers = [
            setTimeout(() => map.invalidateSize(), 50),
            setTimeout(() => map.invalidateSize(), 150),
            setTimeout(() => map.invalidateSize(), 300),
            setTimeout(() => map.invalidateSize(), 500)
        ];

        return () => timers.forEach(t => clearTimeout(t));
    }, [map]);

    return null;
}

export default function ReportMiniMap({ lat, long }: ReportMiniMapProps) {
    const position: [number, number] = [lat, long];
    const containerRef = useRef<HTMLDivElement>(null);
    const [key, setKey] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => setKey(prev => prev + 1));
        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '300px',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: '1px solid #e0e0e0'
            }}
        >
            <MapContainer
                key={key}
                center={position}
                zoom={15}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                dragging={true}
                zoomControl={true}
                attributionControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                <Marker position={position} />
                <MapResizer />
            </MapContainer>
        </div>
    );
}
