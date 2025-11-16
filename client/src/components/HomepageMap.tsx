import React, { useRef, useEffect, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import leaflet from 'leaflet';
import './map.css';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';
import { useAppContext } from '../contexts/AppContext';

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
		if(selected) {
		console.log('NEW COORDS : ' + JSON.stringify(selected));
		}
	}, [selected]);
	
	const turinPolysRef = useRef<leaflet.LatLng[][]>([]);
	
	const pointInPolygon = (lat: number, lng: number, polygon: leaflet.LatLng[]): boolean => {
		let inside = false;
		for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].lng, yi = polygon[i].lat;
			const xj = polygon[j].lng, yj = polygon[j].lat;
			const intersect = (yi > lat) !== (yj > lat) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
			
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
	};
	
	const nearestPointOnTurin = useCallback((lat: number, lng: number): { lat: number; lng: number } | null => {
		if(!turinPolysRef.current.length) return null;

		let best: { x: number; y: number; d2: number } | null = null;
		for(const poly of turinPolysRef.current) {
			for(let i = 0; i < poly.length; i++) {
				const a = poly[i];
				const b = poly[(i + 1) % poly.length];
				const cand = nearestOnSegment(lng, lat, a.lng, a.lat, b.lng, b.lat);
				
				if(!best || cand.d2 < best.d2) best = cand;
			}
		}

		return best ? { lat: best.y, lng: best.x } : null;
	}, []);

  	useEffect(() => {
		if (map.current) return; // stops map from intializing more than once
		if (!mapContainer.current) return; // if doesn't exist stops

		map.current = new leaflet.Map(mapContainer.current, {
			center: leaflet.latLng(center.lat, center.lng),
			zoom: zoom,
			minZoom: 11,
			maxZoom: 18
		});
		
		new MaptilerLayer({ apiKey: 'gb0u8xp4Dznehd1U110M' }).addTo(map.current);
		
		const nominatimUrl = 'https://nominatim.openstreetmap.org/search.php?q=Turin%2C+Italy&polygon_geojson=1&format=jsonv2';
		type PolygonCoords = number[][][];
		type MultiPolygonCoords = number[][][][];
		interface NominatimResult { geojson?: { type: 'Polygon'; coordinates: PolygonCoords } | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords } }
    
		fetch(nominatimUrl)
			.then(r => r.json())
			.then((results: NominatimResult[]) => {
				const feature = results.find(f => f.geojson && (f.geojson.type === 'Polygon' || f.geojson.type === 'MultiPolygon'));
				if(!feature || !feature.geojson) throw new Error('No polygon found for Turin');
				const gj = feature.geojson;

				const holes: [number, number][][] = [];
        		if(gj && gj.type === 'Polygon') {
					const rawOuter = (gj.coordinates as PolygonCoords)[0];
					const outer: [number, number][] = rawOuter.map((pair) => {
						const [lng, lat] = pair as [number, number];
						return [lat, lng];
					});

					holes.push(outer.slice().reverse());
					turinPolysRef.current = [outer.map((pair: [number, number]) => leaflet.latLng(pair[0], pair[1]))];
				} else if(gj && gj.type === 'MultiPolygon') {
					const rawMulti = gj.coordinates as MultiPolygonCoords;
					const polys: leaflet.LatLng[][] = [];
          
					rawMulti.forEach((poly) => {
						const rawOuter = poly[0];
						const outer: [number, number][] = rawOuter.map((pair) => {
							const [lng, lat] = pair as [number, number];
							return [lat, lng];
						});

						holes.push(outer.slice().reverse());
						polys.push(outer.map((pair) => leaflet.latLng(pair[0], pair[1])));
					});
					
					turinPolysRef.current = polys;
				}
		
				const borderLayer = leaflet.geoJSON(gj as unknown as GeoJSON.GeoJsonObject, { style: { color: '#0057A0', weight: 4, fillOpacity: 0 } }).addTo(map.current!);
				map.current!.fitBounds(borderLayer.getBounds(), { padding: [20, 20] });
			})
      		.catch(err => console.error('Failed to load Turin boundary:', err));
  	}, [center.lng, center.lat, zoom, setSelected]);
	
	useEffect(() => {
		if(!map.current) return;

		const onClick = (e: leaflet.LeafletMouseEvent) => {
			if(!isLoggedIn) return;
			if(!turinPolysRef.current.length) return;

			const { lat, lng } = e.latlng;
			const inside = turinPolysRef.current.some(poly => pointInPolygon(lat, lng, poly));
			const snapped = inside ? { lat, lng } : nearestPointOnTurin(lat, lng);
			if(!snapped) return;

			setSelected(snapped);

			if(!map.current) return;
			if(!markerRef.current) {
				markerRef.current = leaflet.marker([snapped.lat, snapped.lng]).addTo(map.current);
			} else {
				markerRef.current.setLatLng([snapped.lat, snapped.lng]);
			}
		};

		map.current.on('click', onClick);
		return () => {
			map.current?.off('click', onClick);
		};
	}, [isLoggedIn, setSelected]);

	useEffect(() => {
		if(!map.current || !selected) return;
		
		const { lat, lng } = selected;
		if(!markerRef.current) {
			markerRef.current = leaflet.marker([lat, lng]).addTo(map.current);
		} else {
			markerRef.current.setLatLng([lat, lng]);
		}

		map.current.setView([lat, lng], map.current.getZoom());
	}, [selected]);

	return (
		<div className = 'map-wrap'>
			<div ref = { mapContainer } className = 'map'/>
		</div>
	);
}