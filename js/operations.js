// Draw polygon
const processPolygon = (e, map, draw, subtitlePrevValue) => {
    // Process coordinates of drawn polygon
    console.log("processPolygon", e, e.features[0].geometry.coordinates[0]);
    if (e.features.length && e.features[0].geometry.coordinates && e.features[0].geometry.coordinates[0].length >= 3) {
        let coordinates = e.features[0].geometry.coordinates[0];
        console.log("coordinates", coordinates);

        let bb = bbox(coordinates);        
        document.getElementById("nw-lat").value = bb['nw'][0];
        document.getElementById("nw-lon").value = bb['nw'][1];
        document.getElementById("se-lat").value = bb['se'][0];
        document.getElementById("se-lon").value = bb['se'][1];
    }

    // Disable draw
    if (draw && map.hasControl(draw)) {
        map.removeControl(draw);
    }
    document.getElementsByClassName("mapboxgl-canvas")[0].style.cursor = "";

    // Show form and replace subtitle
    subtitle.innerHTML = subtitlePrevValue;
    form.classList.remove("hidden");
}

const drawPolygon = (map) => {
    // Hide form and show instructions
    subtitlePrevValue = subtitle.innerHTML;
    subtitle.innerHTML = "Draw the polygon by clicking on the map. Click twice to finish!";
    form.classList.add("hidden");

    // Enable draw mode
    const draw = new MapboxDraw({
        displayControlsDefault: false,
        defaultMode: 'draw_polygon'
    });
    map.addControl(draw);
    document.getElementsByClassName("mapboxgl-canvas")[0].style.cursor = "crosshair";

    // Listen to draw create event, to process it further
    map.on('draw.create', (e) => processPolygon(e, map, draw, subtitlePrevValue));
}

// GeoJSON// javascript
// Robust coordinate extraction from any GeoJSON object
const isCoordinate = (v) => Array.isArray(v) && v.length >= 2 && typeof v[0] === 'number' && typeof v[1] === 'number';

const collectCoordsFromArray = (arr, out) => {
    if (!Array.isArray(arr)) return;
    if (isCoordinate(arr)) {
        out.push([arr[0], arr[1]]);
        return;
    }
    for (const item of arr) collectCoordsFromArray(item, out);
};

const collectGeometry = (geom, out) => {
    if (!geom) return;
    if (geom.type === 'GeometryCollection') {
        (geom.geometries || []).forEach(g => collectGeometry(g, out));
    } else if (geom.coordinates !== undefined) {
        collectCoordsFromArray(geom.coordinates, out);
    }
};

const extractCoordinates = (geojson) => {
    const out = [];
    if (!geojson) return out;

    const t = geojson.type;
    if (t === 'FeatureCollection') {
        (geojson.features || []).forEach(f => { if (f && f.geometry) collectGeometry(f.geometry, out); });
    } else if (t === 'Feature') {
        collectGeometry(geojson.geometry, out);
    } else if (t === 'GeometryCollection') {
        (geojson.geometries || []).forEach(g => collectGeometry(g, out));
    } else if (t && geojson.coordinates !== undefined) {
        collectCoordsFromArray(geojson.coordinates, out);
    } else {
        // Fallback: try to find coordinate arrays anywhere in the object
        collectCoordsFromArray(geojson, out);
    }

    // keep only valid numeric lon/lat pairs
    return out.filter(c => isFinite(c[0]) && isFinite(c[1]));
};

// bbox: accepts either an array of [lon,lat] pairs or a GeoJSON object
const bbox = (coordinatesOrGeoJSON) => {
    let coords = [];
    if (Array.isArray(coordinatesOrGeoJSON) && coordinatesOrGeoJSON.length && isCoordinate(coordinatesOrGeoJSON[0])) {
        coords = coordinatesOrGeoJSON;
    } else {
        coords = extractCoordinates(coordinatesOrGeoJSON);
    }

    if (!coords.length) return null;

    const lons = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    return {
        nw: [Math.max(...lats), Math.min(...lons)], // [lat, lon]
        se: [Math.min(...lats), Math.max(...lons)], // [lat, lon]
    };
};

// Updated processGeoJSON to accept any GeoJSON top-level structure
const processGeoJSON = () => {
    let val = null;
    try {
        val = JSON.parse(document.getElementById("geojson").value.trim());
    } catch (e) {
        //
    }

    const coordinates = extractCoordinates(val);

    if (!val || !coordinates || coordinates.length < 1) {
        const message = `The value provided is not a valid GeoJSON`;
        dialog_error.getElementsByTagName("p")[0].innerHTML = message;
        dialog_error.classList.remove("hidden");
        throw new Error(message);
    }

    const bb = bbox(coordinates);
    if (!bb) {
        const message = `Could not compute bounding box from the provided GeoJSON`;
        dialog_error.getElementsByTagName("p")[0].innerHTML = message;
        dialog_error.classList.remove("hidden");
        throw new Error(message);
    }

    document.getElementById("nw-lat").value = bb['nw'][0];
    document.getElementById("nw-lon").value = bb['nw'][1];
    document.getElementById("se-lat").value = bb['se'][0];
    document.getElementById("se-lon").value = bb['se'][1];

    dialog_geojson.classList.add("hidden");
};