// Location and screen size
const lng2pixel = (lng, zoom) => {
    return ((lng + 180) / 360 * Math.pow(2, zoom)) * TILE_SIZE;
}

const lat2pixel = (lat, zoom) => {
    return ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)) * TILE_SIZE
}

const unproject = (coords, zoom) => {
    const [lat, lng] = coords;
    return [Math.floor(lng2pixel(lng, zoom)), Math.floor(lat2pixel(lat, zoom))];
}

function coordinatesDifference(a, b) {
    if (a > 0 && b > 0) return Math.abs(a - b);
    if (a < 0 && b < 0) return Math.abs(Math.abs(a) - Math.abs(b));
    if (a == 0) return Math.abs(b);
    if (b == 0) return Math.abs(a);
    return Math.abs(a) + Math.abs(b)
}

function roundToScreenSize(innerWidth, innerHeight, nw, se, worldSize) {

    const nwM = mapboxgl.MercatorCoordinate.fromLngLat({ lng: nw[1], lat: nw[0] });
    const seM = mapboxgl.MercatorCoordinate.fromLngLat({ lng: se[1], lat: se[0] });
    const [xMin, yMin] = [nwM.x * worldSize, nwM.y * worldSize];
    const [xMax, yMax] = [seM.x * worldSize, seM.y * worldSize];

    const wSpan = xMax - xMin;
    const hSpan = yMax - yMin;

    const wScreens = Math.ceil(wSpan / innerWidth);
    const hScreens = Math.ceil(hSpan / innerHeight);

    const seMRounded = new mapboxgl.MercatorCoordinate(
        (xMin + wScreens * innerWidth) / worldSize,
        (yMin + hScreens * innerHeight) / worldSize,
        0
    );

    const newSE = seMRounded.toLngLat();

    const width = wScreens * innerWidth;
    const height = hScreens * innerHeight;

    return { width, height, wScreens, hScreens, newSE }

}

async function copy(source, destination, sw, sh, dx, dy, dw, dh) {
    for (let i = 0; i < sh; i++) {
        for (let j = 0; j < sw; j++) {
            destination[(dy + i) * dw + dx + j] = source[i * sw + j];
        }
    }
}


// Map manipulation
const shadeMapLoaded = (shadeMap) => {
    return new Promise((res, rej) => {
        shadeMap.on('idle', res);
    });
};

const shadeMapBuild = (map, shademapKey, layer_type) => {
    return new ShadeMap({
        apiKey: shademapKey,
        date: new Date(Date.UTC(2025, 6, 21, 12, 0)), // Temporary, will be changed before download
        color: '#ff0000',
        opacity: 1,
        terrainSource: {
            maxZoom: 25,
            tileSize: 256,
            getSourceUrl: ({ x, y, z }) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
            getElevation: ({ r, g, b, a }) => (r * 256 + g + b / 256) - 32768,
            _overzoom: 18,
        },
        sunExposure: layer_type === LAYER_SUN ? {
            enabled: true,
            startDate: new Date(Date.UTC(2025, 6, 21, 8, 0)),
            endDate: new Date(Date.UTC(2025, 6, 21, 18, 0)),
            iterations: 32
        } : { enabled: false },
        getFeatures: async () => {
            await SMUtils.mapLoaded(map);
            const buildingData = map.querySourceFeatures('composite', { sourceLayer: 'building' }).filter((feature) => {
                return feature.properties && feature.properties.underground !== "true" && (feature.properties.height || feature.properties.render_height)
            });
            return buildingData;
        },
    })
}

async function loadScreen(shadeMap, coords, zoom, worldSize) {
    const [x, y] = coords;
    map.setZoom(zoom);
    const mercX = (x + innerWidth / 2) / worldSize;
    const mercY = (y + innerHeight / 2) / worldSize;
    const merc = new mapboxgl.MercatorCoordinate(mercX, mercY, 0);
    const center = merc.toLngLat();
    map.setCenter(center);
    const smLoaded = shadeMapLoaded(shadeMap)
    const mapboxLoaded = SMUtils.mapLoaded(map);
    await Promise.all([mapboxLoaded, smLoaded]);
    return;
}

const processPolygon = (e, map, draw, form, subtitle, subtitlePrevValue) => {
    // Process coordinates of drawn polygon
    console.log("processPolygon", e, e.features[0].geometry.coordinates[0]);
    if (e.features.length && e.features[0].geometry.coordinates && e.features[0].geometry.coordinates[0].length>=3) {
        let coordinates = e.features[0].geometry.coordinates[0];
        console.log("coordinates", coordinates);

        const lons = coordinates.map(c => c[0]);
        const lats = coordinates.map(c => c[1]);
        console.log("lons", lons)

        console.log("COORDINARES", Math.max(...lats), Math.min(...lons))
        console.log("COORDINARES", Math.min(...lats), Math.max(...lons))

        document.getElementById("nw-lat").value = Math.max(...lats);
        document.getElementById("nw-lon").value = Math.min(...lons);
        document.getElementById("se-lat").value = Math.min(...lats);
        document.getElementById("se-lon").value = Math.max(...lons);
    }

    // Disable draw
    if (draw && map.hasControl(draw)) {
        map.removeControl(draw);
    }
    document.getElementsByClassName("mapboxgl-canvas")[0].style.cursor=""; 
    
    // Show form and replace subtitle
    subtitle.innerHTML = subtitlePrevValue;
    form.classList.remove("hidden"); 
}

const drawPolygon = (map, form, subtitle) => {
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
    document.getElementsByClassName("mapboxgl-canvas")[0].style.cursor="crosshair";

    // Listen to draw create event, to process it further
    map.on('draw.create', (e) => processPolygon(e, map, draw, form, subtitle, subtitlePrevValue));
}


// TIFF file generation
async function download(
    data, // Exported data to download
    nw, se, width, height, cols, rows, // Area global values
    batchCols, batchRows, colStart, rowStart, colEnd, rowEnd, // Sheet batch information
    timestamp, // Timestamp is added to file name (list or instance)
    subarea // Subarea number for file name purposes
) {

    console.log("start", colStart, rowStart);
    console.log("end", colEnd, rowEnd);
    console.log("cols", cols, "batchcols", batchCols);
    console.log("rows", rows, "batchrows", batchRows);

    let latitudePerRow = coordinatesDifference(nw[0], se[0]) / rows;
    let latitudeStart = nw[0] - rowStart * latitudePerRow; // We start on top nw, so we go south (-)

    let longitudePerColumn = coordinatesDifference(se[1], nw[1]) / cols;
    console.log("longitudePerColumn", longitudePerColumn);
    let longitudeStart = nw[1] + colStart * longitudePerColumn; // We start on top nw, so we go east (+)

    const ModelTiepoint = [0, 0, 0, longitudeStart, latitudeStart, 0];
    const ModelPixelScale = [coordinatesDifference(se[1], nw[1]) / width, coordinatesDifference(nw[0], se[0]) / height, 0];

    console.log("ModelTiepoint", ModelTiepoint);
    console.log("ModelPixelScale", ModelPixelScale);

    const metadata = {
        width: (width / cols) * batchCols,
        height: (height / rows) * batchRows,
        ModelTiepoint,
        ModelPixelScale,
        GeographicTypeGeoKey: 4326,
        // GDAL_NODATA,
        GeogCitationGeoKey: 'WGS 84',
    };
    console.log(data.length);
    console.log("Starting GeoTIFF.writeArrayBuffer...", metadata);
    const arrayBuffer = await GeoTIFF.writeArrayBuffer(
        Array.from(data),
        metadata
    );
    console.log("GeoTIFF.writeArrayBuffer finished.");
    const typedArray = new Uint8Array(arrayBuffer);
    const charCode = typedArray.reduce((all, char) => {
        return (all += String.fromCharCode(char));
    }, "");
    const base64 = btoa(charCode);
    const datauri = `data:image/tiff;base64,${base64}`;

    const link = document.createElement("a");
    link.href = datauri;

    let filename = document.getElementById("filename").value;
    if (!filename) filename = "stitch";
    let append = Array.isArray(timestamp) ? `_${getDateString(timestamp[0])}_${getDateString(timestamp[1])}` : `_${getDateString(timestamp)}`;
    if (subarea) append = `_part${subarea}`
    link.download = `${filename}${append}.tiff`


    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Other useful methods
const pad = (num) => String(num).padStart(2, '0');
const getDateString = (timestamp) => `${timestamp.getFullYear()}${pad(timestamp.getMonth() + 1)}${pad(timestamp.getDate())}_${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}`
