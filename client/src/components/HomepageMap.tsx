import React, { useRef, useEffect, useState, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polygon } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './map.css';
import { useAppContext } from '../contexts/AppContext';
import type { Coord, Report } from '../models/models';
import { REPORT_STATUS_COLORS } from '../constants/reportStatusColors';
import { ChevronUp } from 'lucide-react';

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

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].lng, yi = polygon[i].lat;
		const xj = polygon[j].lng, yj = polygon[j].lat;

		const intersect = yi > lat !== yj > lat && long < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

		if (intersect) inside = !inside;
	}

	return inside;
}

const nearestOnSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): { x: number; y: number; d2: number } => {
	const dx = x2 - x1;
	const dy = y2 - y1;

	if (dx === 0 && dy === 0) {
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
}

type Props = {
	selected: Coord | null;
	setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
	reports?: Report[] | null;
};

const fetchAddress = async (lat: number, lng: number): Promise<string> => {
	try {
		const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`);

		if (!res.ok) return 'Not available';

		const data = await res.json();
		const road = data.address?.road || data.address?.pedestrian || '';
		const houseNumber = data.address?.house_number || '';
		const address = `${road} ${houseNumber}`.trim() || data.display_name || '';

		return address || 'Not available';
	} catch (error) {
		console.error(error);
		return 'Not available';
	}
}

const LocationMarker = ({ selected, setSelected, turinPolys }: { selected: Coord | null, setSelected: (c: Coord | null) => void, turinPolys: L.LatLng[][] }) => {
	const { isLoggedIn } = useAppContext();
	const markerRef = useRef<L.Marker>(null);

	const location = useLocation();
	const navigate = useNavigate();

	useMapEvents({
		async click(e) {
			if (!isLoggedIn || !turinPolys.length) return;

			const { lat, lng } = e.latlng;
			const inside = turinPolys.some((poly) => pointInPolygon(lat, lng, poly));
			const snapped = inside ? { lat, lng } : nearestPointOnTurin(lat, lng, turinPolys);

			if (snapped) {
				setSelected({ lat: snapped.lat, lng: snapped.lng, address: 'Fetching address...' });
				const addr = await fetchAddress(snapped.lat, snapped.lng);
				setSelected({ lat: snapped.lat, lng: snapped.lng, address: addr });

				setTimeout(() => {
					if (markerRef.current) {
						markerRef.current.openPopup();
					}
				}, 100);
			}
		},
	});

	return selected === null ? null : (
		<Marker position={[selected.lat, selected.lng]} ref={markerRef}>
			<Popup>
				<div style={{ textAlign: 'center' }}>
					<p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{selected.address || 'Not available'}</p>
					{location.pathname === '/' && (
						<button
							onClick={() => navigate('/reports/new')}
							style={{
								backgroundColor: '#0057A0',
								color: 'white',
								border: 'none',
								padding: '5px 5px',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '12px',
								width: '100%'
							}}>
							+ New Report
						</button>
					)}
				</div>
			</Popup>
		</Marker>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClusterCustomIcon = (cluster: any) => {
	const count = cluster.getChildCount();
	let color;

	if (count < 10) color = '#FDBA74'; // soft orange
	else if (count < 25) color = '#FB923C'; // bright orange
	else if (count < 50) color = '#F97316'; // vivid amber
	else if (count < 100) color = '#EA580C'; // strong orange-red
	else color = '#C2410C'; // deep red

	return L.divIcon({
		html: `
			<div style='
				width: 40px;
				height: 40px;
				background-color: ${color}DD;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				font-weight: bold;
				font-size: 16px;
				box-shadow: 0 4px 12px rgba(0,0,0,0.3);
			'>${count}</div>
		`,
		className: 'custom-cluster-icon',
		iconSize: L.point(50, 50, true),
	});
};

const sanitizeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const createReportIcon = (status: string) => {
	const statusColor = REPORT_STATUS_COLORS[status] || '#6B7280';
	return L.divIcon({
		className: 'custom-report-marker',
		html: `
			<div style='
				width: 30px;
				height: 30px;
				background-color: ${statusColor};
				border-radius: 50%;
				box-shadow: 0 2px 8px rgba(0,0,0,0.3);
			'></div>
		`,
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});
}

const MapUpdater = ({ position }: { position: Coord | null }) => {
	const map = useMap();
	const prevPosition = useRef<Coord | null>(null);

	useEffect(() => {
		if (!position) return;

		if (prevPosition.current && prevPosition.current.lat === position.lat && prevPosition.current.lng === position.lng) return;

		prevPosition.current = position;

		try {
			map.setView([position.lat, position.lng], map.getZoom(), {
				animate: true,
				duration: 1.5
			});
		} catch (error) {
			console.error('Error in setView:', error);
		}
	}, [position, map]);

	return null;
}

// Map component WITHOUT the markers' cluster feature (just the feature to select a point on the map)
export default function Map({ selected, setSelected }: Props) {
	const center = { lat: 45.06985, lng: 7.68228 };
	const zoom = 11;
	const [turinPolys, setTurinPolys] = useState<L.LatLng[][]>([]);

	useEffect(() => {
		const nominatimUrl = 'https://nominatim.openstreetmap.org/search.php?q=Turin%2C+Italy&polygon_geojson=1&format=jsonv2';

		type PolygonCoords = number[][][];
		type MultiPolygonCoords = number[][][][];
		interface NominatimResult {
			geojson?: | { type: 'Polygon'; coordinates: PolygonCoords } | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords };
		}

		fetch(nominatimUrl)
			.then(r => r.json())
			.then((results: NominatimResult[]) => {
				const feature = results.find(f => f.geojson && (f.geojson.type === 'Polygon' || f.geojson.type === 'MultiPolygon'));
				if (!feature || !feature.geojson) return;

				const gj = feature.geojson;
				const polys: L.LatLng[][] = [];

				if (gj.type === 'Polygon') {
					const rawOuter = (gj.coordinates as PolygonCoords)[0];
					polys.push(rawOuter.map((pair) => L.latLng(pair[1], pair[0])));
				} else if (gj.type === 'MultiPolygon') {
					const rawMulti = gj.coordinates as MultiPolygonCoords;
					rawMulti.forEach((poly) => {
						const rawOuter = poly[0];
						polys.push(rawOuter.map((pair) => L.latLng(pair[1], pair[0])));
					});
				}
				setTurinPolys(polys);
			})
			.catch(err => console.error('Failed to load Turin boundary:', err));
	}, []);

	return (
		<div id='map-container' className='map-wrap'>
			<MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={true} className='map'>
				<TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
				{turinPolys.length > 0 && (
					<Polygon positions={turinPolys} pathOptions={{ color: '#0057A0', weight: 4, fillOpacity: 0 }} />
				)}
				<MapUpdater position={selected} />
				<LocationMarker selected={selected} setSelected={setSelected} turinPolys={turinPolys} />
			</MapContainer>
		</div>
	);
}

// Map component WITH the markers' cluster feature and the other ones
export function HomepageMap({ selected, setSelected, reports }: Props) {
	const center = { lat: 45.06985, lng: 7.68228 };
	const zoom = 11;
	const [turinPolys, setTurinPolys] = useState<L.LatLng[][]>([]);
	const [legendOpen, setLegendOpen] = useState(true);
	const statusEntries = useMemo(
		() => Object.entries(REPORT_STATUS_COLORS).filter(([status]) => status !== 'Pending'),
		[]
	);
	const legendPanelId = useId();
	const legendBaseId = useMemo(() => `map-legend-${legendPanelId.replace(/[^a-zA-Z0-9]/g, '')}`, [legendPanelId]);
	const legendContainerId = `${legendBaseId}-container`;
	const legendToggleId = `${legendBaseId}-toggle`;
	const legendListId = `${legendBaseId}-list`;

	useEffect(() => {
		const nominatimUrl = 'https://nominatim.openstreetmap.org/search.php?q=Turin%2C+Italy&polygon_geojson=1&format=jsonv2';

		type PolygonCoords = number[][][];
		type MultiPolygonCoords = number[][][][];
		interface NominatimResult {
			geojson?: | { type: 'Polygon'; coordinates: PolygonCoords } | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords };
		}

		fetch(nominatimUrl)
			.then(r => r.json())
			.then((results: NominatimResult[]) => {
				const feature = results.find(f => f.geojson && (f.geojson.type === 'Polygon' || f.geojson.type === 'MultiPolygon'));
				if (!feature || !feature.geojson) return;

				const gj = feature.geojson;
				const polys: L.LatLng[][] = [];

				if (gj.type === 'Polygon') {
					const rawOuter = (gj.coordinates as PolygonCoords)[0];
					polys.push(rawOuter.map((pair) => L.latLng(pair[1], pair[0])));
				} else if (gj.type === 'MultiPolygon') {
					const rawMulti = gj.coordinates as MultiPolygonCoords;
					rawMulti.forEach((poly) => {
						const rawOuter = poly[0];
						polys.push(rawOuter.map((pair) => L.latLng(pair[1], pair[0])));
					});
				}
				setTurinPolys(polys);
			})
			.catch(err => console.error('Failed to load Turin boundary:', err));
	}, []);

	return (
		<div id='map-container' className='map-wrap'>
			<MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={true} className='map'>
				<TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
				{turinPolys.length > 0 && (
					<Polygon positions={turinPolys} pathOptions={{ color: '#0057A0', weight: 4, fillOpacity: 0 }} />
				)}
				<MapUpdater position={selected} />
				<LocationMarker selected={selected} setSelected={setSelected} turinPolys={turinPolys} />
				<MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon} maxClusterRadius={80} spiderfyOnMaxZoom={true} showCoverageOnHover={false}>
					{reports && reports.map((report) => (
						<Marker key={report.id} position={[report.lat, report.long]} icon={createReportIcon(report.status)}>
							<Popup>{report.title}</Popup>
						</Marker>
					))}
				</MarkerClusterGroup>
			</MapContainer>
			<motion.div
				id={legendContainerId}
				className='map-legend'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: 'easeOut' }}
			>
				<motion.button
					type='button'
					id={legendToggleId}
					className='map-legend-toggle'
					onClick={() => setLegendOpen((prev) => !prev)}
					aria-expanded={legendOpen}
					aria-controls={legendPanelId}
					whileHover={{ scale: 1.01 }}
					whileTap={{ scale: 0.98 }}
				>
					<div className='map-legend-title-block' id={`${legendBaseId}-title`}>
						<span className='map-legend-title'>Report's color mapping</span>
					</div>
					<motion.span
						id={`${legendBaseId}-caret`}
						className={`map-legend-caret ${legendOpen ? 'open' : ''}`}
						aria-hidden='true'
						animate={{ rotate: legendOpen ? 0 : -180 }}
						transition={{ duration: 0.3, ease: 'easeOut' }}
					>
						<ChevronUp size={16} />
					</motion.span>
				</motion.button>
				<AnimatePresence initial={false}>
					{legendOpen && (
						<motion.div
							key='map-legend-body'
							id={legendPanelId}
							className='map-legend-body'
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3, ease: 'easeOut' }}
						>
							<ul id={legendListId} className='map-legend-list'>
								{statusEntries.map(([status, color], index) => {
									const rowId = `${legendBaseId}-status-${sanitizeId(status)}`;
									return (
										<motion.li
											id={rowId}
											key={status}
											className='map-legend-row'
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -10 }}
											transition={{ delay: 0.05 * index }}
										>
											<span
												id={`${rowId}-swatch`}
												className='map-legend-color'
												style={{ backgroundColor: color }}
												aria-hidden='true'
											></span>
											<div className='map-legend-labels'>
												<span id={`${rowId}-label`} className='map-legend-status'>
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
