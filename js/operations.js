// Draw polygon
const bbox = (coordinates) => {
    console.log("bbox", coordinates);
    // Get bound box, given array of coordinates
    const lons = coordinates.map(c => c[0]);
    const lats = coordinates.map(c => c[1]);
    console.log("lons", lons)

    console.log("COORDINARES", Math.max(...lats), Math.min(...lons))
    console.log("COORDINARES", Math.min(...lats), Math.max(...lons))
    return {
        nw: [Math.max(...lats), Math.min(...lons)],
        se: [Math.min(...lats), Math.max(...lons)],
    }
}

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

// GeoJSON
const processGeoJSON = () => {
    let val = null;
    try {
        val = JSON.parse(document.getElementById("geojson").value.trim());
    } catch (e) {
        //
    }

    let coordinates = [];
    if (val['type']==="MultiPolygon" && val['coordinates'] && val['coordinates'].length) coordinates = val['coordinates'].flat(2);
    else if (val['type']==="Polygon" && val['coordinates'] && val['coordinates'].length) coordinates = val['coordinates'].flat();


    if (
        !val || !coordinates || coordinates.length<2
    ) {
        let message = `The value provided is not a valid GeoGSON`;
        dialog_error.getElementsByTagName("p")[0].innerHTML = message;
        dialog_error.classList.remove("hidden");
        throw new Error(message);
    }


    let bb = bbox(coordinates);        
    document.getElementById("nw-lat").value = bb['nw'][0];
    document.getElementById("nw-lon").value = bb['nw'][1];
    document.getElementById("se-lat").value = bb['se'][0];
    document.getElementById("se-lon").value = bb['se'][1];

    dialog_geojson.classList.add("hidden");
}