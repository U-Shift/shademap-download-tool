// Constants
const LAYER_SHADOW = "layer-shadow";
const LAYER_SUN = "layer-sun";

// Parameters
const TILE_SIZE = 512;
let CURRENT_LAYER = LAYER_SHADOW;

// DOM elements
const loader = document.getElementById('loader');

const div_panel = document.getElementById('panel');
const subtitle = div_panel.getElementsByTagName("header")[0].getElementsByTagName("small")[1];
const form = document.getElementById("form");

const dialog_keys = document.getElementById('modal-keys');
const dialog_help = document.getElementById('modal-help');
const dialog_about = document.getElementById('modal-about');
const dialog_geojson = document.getElementById('modal-geojson');
const dialog_success = document.getElementById('modal-success');
const dialog_error = document.getElementById('modal-error');

const op_draw = document.getElementById('op-draw');
const op_geojson = document.getElementById('op-geojson');
const op_geojson_submit = document.getElementById('op-geojson-submit');

// Export handling
async function generateExport(map, shademapKey) {

    // Compute parameters
    let zoom = parseFloat(document.getElementById("zoom").value.trim());
    let nw = [parseFloat(document.getElementById("nw-lat").value.trim()), parseFloat(document.getElementById("nw-lon").value.trim())];
    let se = [parseFloat(document.getElementById("se-lat").value.trim()), parseFloat(document.getElementById("se-lon").value.trim())];
    let iterations = parseInt(document.getElementById("iterations").value.trim());

    let dates = document.getElementById("dates").value.split(/,|;| /).map(v => v.trim()).filter(v => !!v);
    let timestamps = [];
    if (CURRENT_LAYER === LAYER_SHADOW) {
        let hours = document.getElementById("hours").value.split(/,|;| /).map(v => v.trim()).filter(v => !!v);
        if (hours.length && dates.length) {
            timestamps = dates.map(d => hours.map(h => new Date(`${d}T${h}`))).flat(1);
        }
    } else { // LAYER_SUN
        let hour_start = document.getElementById("hour-start").value.trim();
        let hour_end = document.getElementById("hour-end").value.trim();
        if (dates.length && !!hour_start && !!hour_end) {
            timestamps = dates.map(d => [new Date(`${d}T${hour_start}`), new Date(`${d}T${hour_end}`)])
        }
    }

    // Validate if there is any missing
    if (!zoom || !nw.every(v => !!v) || !se.every(v => !!v) || !timestamps.length || !iterations) {
        let message = `Invalid parameters!`;
        dialog_error.getElementsByTagName("p")[0].innerHTML = message;
        dialog_error.classList.remove("hidden");
        throw new Error(message);
    }

    // Show loader and hide modal
    div_panel.classList.add("hidden");
    loader.style.display = `block`;

    let shadeMap = shadeMapBuild(map, shademapKey, CURRENT_LAYER).addTo(map);
    let mLoaded = SMUtils.mapLoaded(map);
    let smLoaded = shadeMapLoaded(shadeMap);
    await Promise.all([mLoaded, smLoaded]);

    // Derived parameters
    const worldSize = TILE_SIZE * 2 ** zoom;

    const { innerWidth, innerHeight } = window;
    const [xMin, yMin] = unproject(nw, zoom);
    const [xMax, yMax] = unproject(se, zoom);

    // Area to export is divided into several screens, according to defined parameters
    const { width, height, wScreens, hScreens, newSE } = roundToScreenSize(innerWidth, innerHeight, nw, se, worldSize);
    se[0] = newSE.lat;
    se[1] = newSE.lng;

    console.log("inner width x height", innerWidth, innerHeight);
    console.log("width x height", width, height);
    console.log("screens", wScreens, hScreens);

    let screensGlobal = [];
    for (let i = 0; i < wScreens; i++) {
        for (let j = 0; j < hScreens; j++) {
            screensGlobal.push([xMin + i * innerWidth, yMin + j * innerHeight]);
        }
    }
    console.log("screens", screensGlobal);

    // Divide screens array into several batches, making sure each does not exceed MAX_ARRAY_SIZE
    // AND if changes column, must cover same rows as the previous (to avoid black areas, since the generated TIFF is a square)
    // Each batch will produce a TIFF file
    const MAX_ARRAY_SIZE = 2 ** 26;
    const windowPixels = innerHeight * innerWidth; // Pixels that the browser window covers
    const areaPixels = width * height; // Pixels covered by the area to export
    const rows = Math.ceil(height / innerHeight); // Number of sheets rows
    const cols = Math.ceil(width / innerWidth); // Number of sheets cols

    let screensBatches = [];
    let batch = [];
    let batchSize = 0;
    let colI = 0;
    let rowI = 0;
    let colStart = 0;
    let rowStart = 0;
    let colEnd = 0;
    let rowEnd = 0;

    for (let i = 0; i < screensGlobal.length; i++) {
        // Append to batch
        batch.push(screensGlobal[i]);
        batchSize += windowPixels;
        colEnd = colI;
        rowEnd = rowI;

        // Update next index
        rowI += 1;
        if (rowI >= rows) {
            rowI = 0;
            colI += 1;
        }

        // If last screen 
        // OR next passes to next column AND (current batch did not start on first column OR array has no space for a full column)
        // # Last condition avoids black spaces because row or column were not filled totally
        if (
            i + 1 == screensGlobal.length ||
            colI > colStart && (rowStart > 0 || rowI === 0 && (batchSize + windowPixels * rows) > MAX_ARRAY_SIZE)
        ) {
            screensBatches.push({ colStart, colEnd, rowStart, rowEnd, screens: batch });
            batch = [];
            batchSize = 0;

            colStart = colI;
            rowStart = rowI;
        }
    }

    console.log("Generating", screensBatches.length, "batches, on a canvas with", cols, "cols and", rows, "rows");
    console.log("screensBatches", screensBatches);

    // For each timestamp, and for every batch, generate TIFF
    let screenGlobalCounter = 0;
    for (let ti = 0; ti < timestamps.length; ti++) {
        let timestamp = timestamps[ti];

        if (CURRENT_LAYER === LAYER_SHADOW) {
            shadeMap.options.date = timestamp;
        } else { // LAYER_SUN
            shadeMap.options.date = timestamp[0];
            shadeMap.options.sunExposure.startDate = timestamp[0];
            shadeMap.options.sunExposure.endDate = timestamp[1];
            shadeMap.options.sunExposure.iterations = iterations;
        }

        console.log("TIMESTAMP", timestamp, "shademap", shadeMap.options);
        // TODO! Change timestamp inside shademap

        for (let b = 0; b < screensBatches.length; b++) {
            let batch = screensBatches[b];
            let screens = batch['screens'];

            let batchCols = (batch['colEnd'] - batch['colStart'] + 1);
            let batchRows = batchCols == 1 ? (batch['rowEnd'] - batch['rowStart'] + 1) // If on same column, just compute row difference
                : rows; // If changes column, should have all rows

            // Proceed with download
            console.log("Processing batch", b, "with pixels", (width / cols * batchCols) * (height / rows * batchRows));
            const bitmap = new Uint8Array((width / cols * batchCols) * (height / rows * batchRows));
            for (let i = 0; i < screens.length; i++) {
                screenGlobalCounter += 1;
                console.log("> Processing screen", screenGlobalCounter, "of", screens.length, "(", screensGlobal.length, ")");
                let progress = (screenGlobalCounter / screensGlobal.length / timestamps.length * 100).toFixed(0);
                loader.getElementsByTagName("p")[0].innerHTML = `${progress}%`;
                loader.getElementsByTagName("progress")[0].value = progress;
                loader.getElementsByTagName("small")[0].innerHTML = `Analysing screen ${screenGlobalCounter}/${screensGlobal.length * timestamps.length} (screen batch ${b + 1}/${screensBatches.length}, timestamp ${ti + 1}/${timestamps.length})`;

                await loadScreen(shadeMap, screens[i], zoom, worldSize);
                await new Promise((res, rej) => {
                    setTimeout(res, 1000);
                });
                const { data } = shadeMap.toGeoTiff();
                const [x, y] = screens[i];
                console.log("> copy x,y", x, y);
                console.log("> copy x,y fixed", x - xMin - (((xMax - xMin) / batchCols) * batch['colStart']), y - yMin - (((yMax - yMin) / batchRows) * batch['rowStart']));
                console.log("> area widthxheight", (width / cols) * batchCols, (height / rows) * batchRows)
                copy(
                    data, bitmap, // Data parameters
                    innerWidth, innerHeight, // Screen width and height (px)
                    x - xMin, y - yMin, // Coordinates withint bitmap (width batchCols*batchRows cells)
                    (width / cols) * batchCols, (height / rows) * batchRows // Area width and height (px)
                );
            }
            console.log("FINISHED batch", b, "downloading...");
            await download(
                bitmap,
                nw, se, width, height, cols, rows,
                batchCols, batchRows, batch['colStart'], batch['rowStart'], batch['colEnd'], batch['rowEnd'],
                timestamp,
                screensBatches.length > 1 ? b + 1 : undefined,
            );
            console.log("FINISHED downloading!");
        }
    }


    // Display success 
    loader.style.display = `none`;
    div_panel.classList.remove("hidden");
    dialog_success.getElementsByTagName("p")[0].innerHTML = "Your TIFF export was generated successfully!";
    if (timestamps.length > 1) {
        dialog_success.getElementsByTagName("p")[0].innerHTML += `<br/><br/>The TIFF files name contain the timestamp selected to allow the distinction between them.`
    }
    if (screensBatches.length > 1) {
        dialog_success.getElementsByTagName("p")[0].innerHTML += `<br/><br/>The wideness of the area selected exceeds the browser processing capabilities. Do overcome this, it was divided into ${screensBatches.length} smaller and complementar areas, each corresponding to one TIFF file downloaded.`
    }

    dialog_success.classList.remove("hidden");

    shadeMap.remove();
}


// Script kick-off
window.onload = function () {
    // Add default values to form 
    document.getElementById("nw-lat").value = 38.735517;
    document.getElementById("nw-lon").value = -9.136205;
    document.getElementById("se-lat").value = 38.726796;
    document.getElementById("se-lon").value = -9.117215;
    document.getElementById("dates").value = "2025-06-21";
    document.getElementById("hours").value = "12:00";
    document.getElementById("hour-start").value = "06:00";
    document.getElementById("hour-end").value = "18:00";
    document.getElementById("iterations").value = 32;
    document.getElementById("zoom").value = 15;
    document.getElementById("filename").value = "stitch";

    if (localStorage.getItem("mapboxKey")) {
        document.getElementById("key-mapbox").value = localStorage.getItem("mapboxKey");
    }
    if (localStorage.getItem("shademapKey")) {
        document.getElementById("key-shademap").value = localStorage.getItem("shademapKey");
    }

    // Event binding
    dialog_success.getElementsByClassName("modal-close")[0].onclick = function () { dialog_success.classList.add("hidden"); }
    dialog_error.getElementsByClassName("modal-close")[0].onclick = function () { dialog_error.classList.add("hidden"); }
    dialog_help.getElementsByClassName("modal-close")[0].onclick = function () { dialog_help.classList.add("hidden"); }
    dialog_about.getElementsByClassName("modal-close")[0].onclick = function () { dialog_about.classList.add("hidden"); }
    dialog_geojson.getElementsByClassName("modal-close")[0].onclick = function () { dialog_geojson.classList.add("hidden"); }
    Array.from(document.getElementsByClassName("help-modal")).forEach(el => el.onclick = function () { dialog_help.classList.remove("hidden"); })
    Array.from(document.getElementsByClassName("about-modal")).forEach(el => el.onclick = function () { dialog_about.classList.remove("hidden"); })

    // Key validation is required to activate the application workflow
    document.getElementById("key-validation").onclick = function () {
        
        // Manage credentials
        let mapboxKey = document.getElementById("key-mapbox").value.trim();
        let shademapKey = document.getElementById("key-shademap").value.trim();
        let saveCredentials = document.getElementsByName("save-keys")[0];
        if (saveCredentials.checked) {
            localStorage.setItem('mapboxKey', mapboxKey);
            localStorage.setItem("shademapKey", shademapKey);
        } else {
            localStorage.removeItem('mapboxKey');
            localStorage.removeItem("shademapKey");
        }
        if (!mapboxKey || !shademapKey) {
            let message = `Invalid or missing keys!`;
            dialog_error.getElementsByTagName("p")[0].innerHTML = message;
            dialog_error.classList.remove("hidden");
            throw new Error(message);
        }

        // If valid, start map and show form modal
        dialog_keys.classList.add("hidden");
        div_panel.classList.remove("hidden");

        // Initialize map
        mapboxgl.accessToken = mapboxKey;
        var map = window.map = new mapboxgl.Map({
            container: 'map',
            zoom: 15,
            center: {
                lat: 38.735517, lng: -9.136205
            },
            style: 'mapbox://styles/mapbox/streets-v11',
            hash: true
        });

    
        // Once map has loaded, show form and enable download button
        map.on('load', async () => {

            // Show form
            subtitle.innerHTML = "Adjust the parameters and choose the layer you want to export before downloading.";
            form.style = "";
            form.classList.remove("hidden");

            // Buttons listeners
            // > Download btn
            const download_btn = document.getElementById("download");
            download_btn.disabled = false;
            download_btn.innerHTML = "Download shadows";
            download_btn.onclick = function () { generateExport(map, shademapKey) };

            // > Draw polygon btn
            op_draw.onclick = () => drawPolygon(map);

            // > Add GeoJSON
            op_geojson.onclick = () => dialog_geojson.classList.remove("hidden");
            op_geojson_submit.onclick = () => processGeoJSON();
            

            // Listeners for layer change (when user toggles accordion section)
            const layer_shadow = document.getElementById(LAYER_SHADOW);
            const layer_sun = document.getElementById(LAYER_SUN);
            const observer = new MutationObserver(async (mutationsList) => { // Create a MutationObserver
                mutationsList.forEach(async (mutation) => {
                    // Only react when open chages to true (to avoid duplicate, as when one turns true, the other goes false)
                    if (mutation.attributeName === "open" && mutation.target.hasAttribute("open")) {
                        if (mutation.target.id == LAYER_SHADOW) {
                            CURRENT_LAYER = LAYER_SHADOW;
                            download_btn.innerHTML = "Download shadows";
                            download_btn.disabled = false;
                        } else if (mutation.target.id == LAYER_SUN) {
                            CURRENT_LAYER = LAYER_SUN;
                            download_btn.innerHTML = "Download sun exposure";
                            download_btn.disabled = false;
                        }
                    }
                });
            });
            observer.observe(layer_shadow, { attributes: true }); // Configure and start observing
            observer.observe(layer_sun, { attributes: true }); // Configure and start observing
        });
    }
}

