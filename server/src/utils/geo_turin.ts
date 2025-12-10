import * as fs from 'fs';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import { CONFIG } from '@config'; 
import { logError } from '@utils/logger';

type GeoFenceFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

let TURIN_POLYGON: GeoFenceFeature | null = null;

const loadTurinGeofence = () => {
    try {
        const geoJsonData = fs.readFileSync(CONFIG.TURIN.GEO_JSON_FILE_PATH, 'utf8');
        const dataArray = JSON.parse(geoJsonData);

        if(!Array.isArray(dataArray) || dataArray.length === 0) {
            logError('GeoJSON file is empty or not a valid array.');
            return;
        }

        const osmResult = dataArray[0];
        const rawGeometry = osmResult.geojson;
        
        TURIN_POLYGON = turf.feature(rawGeometry) as GeoFenceFeature;

        const type = TURIN_POLYGON.geometry?.type;
        if(!type || (type !== 'Polygon' && type !== 'MultiPolygon')) {
            throw new Error(`The geometry type is not a valid Polygon/MultiPolygon, found: ${type}`);
        }
    } catch(e) {
        logError(`Error in loading Turin GeoJSON: `, e);
        TURIN_POLYGON = null;
    }
}

export const isPointInTurin = (lat: number, long: number): boolean => {
    if(!TURIN_POLYGON) return false;

    const point = turf.point([long, lat]); 
    return turf.booleanPointInPolygon(point, TURIN_POLYGON);
}

loadTurinGeofence();