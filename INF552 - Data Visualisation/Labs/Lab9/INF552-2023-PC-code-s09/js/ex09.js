const ctx = {
    ATTRIB: '<a href="https://www.enseignement.polytechnique.fr/informatique/INF552/">X-INF552</a> - <a href="https://www.adsbexchange.com/data-samples/">ADSBX sample data</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    TRANSITION_DURATION: 1000,
    SC: 4, // half plane icon size
    ADSBX_PREFIX: "1618",
    ADSBX_SUFFIX: "Z",
    ALT_FLOOR: 32000,
    filteredFlights: [],
    planeUpdater: null,
    LFmap: null,
    selectedMark: null
};

// Data fron 20231101 obtained from https://samples.adsbexchange.com/readsb-hist/2023/11/01
// iterate over to simulate real-time queries every 5s
// 161800Z.json
// 1618..Z.json
// 161855Z.json
const LOCAL_DUMP_TIME_INDICES = [...Array(12).keys()].map(i => i * 5);
let LOCAL_DUMP_TIME_INC = 1;

function drawInTheAirPlot() {
    const data = ctx.currentFlights;
    
    const onGroundCount = data.filter(d => d.alt === null).length;
    const inTheAirCount = data.length - onGroundCount;

    const width = 323;
    const height = 50;

    const svg = d3.select("div#inTheAir")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const bars = svg.selectAll("rect")
        .data([onGroundCount, inTheAirCount])
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * (width / 2))
        .attr("y", d => height - d)
        .attr("width", width / 2)
        .attr("height", d => d)
        .attr("fill", (d, i) => i === 0 ? "red" : "green");

    // Ajoutez d'autres éléments (titres, axes, etc.) au besoin
}

function drawAltPlot() {
    const data = ctx.currentFlights;

    const altitudes = data.map(d => d.alt).filter(d => d !== null);
    
    const width = 323;
    const height = 250;

    const svg = d3.select("div#alt")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const bins = d3.histogram()
        .domain([0, 19000])
        .thresholds(d3.range(0, 20000, 1000))(altitudes);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.x1)])
        .range([height, 0]);

    const bars = svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", 1)
        .attr("transform", d => `translate(${xScale(d.length)},${yScale(d.x1)})`)
        .attr("width", d => width - xScale(d.length))
        .attr("height", d => height - yScale(d.x1))
        .attr("fill", "steelblue");

    // Ajoutez d'autres éléments (titres, axes, etc.) au besoin
}

function createViz() {
    console.log("Using D3 v" + d3.version);
    createMap();
    loadFlights();
};

function getPlaneTransform(d) {
    let point = ctx.LFmap.latLngToLayerPoint([d.lat, d.lon]);
    let x = point.x;
    let y = point.y;
    if (d.bearing != null && d.bearing != 0) {
        let t = `translate(${x},${y}) rotate(${d.bearing} ${ctx.SC} ${ctx.SC})`;
        return t;
    }
    else {
        let t = `translate(${x},${y})`;
        return t;
    }
};

function drawPlanes(animate) {
     // Select the <g#planes> element or create it if it doesn't exist
     let planesGroup = d3.select("svg").select("g#planes");
     if (planesGroup.empty()) {
         planesGroup = d3.select("svg").append("g").attr("id", "planes");
     }
 
     // Use D3's data binding to join data with SVG elements
     const planes = planesGroup.selectAll("image")
         .data(ctx.filteredFlights, (d) => d.callsign);
 
     // Handle existing planes (update position and orientation)
     planes
         .attr("transform", d => getPlaneTransform(d))
         .attr("width", 8)
         .attr("height", 8);
 
     // Handle entering planes (create new SVG elements)
     planes.enter()
         .append("image")
         .attr("xlink:href", "plane_icon.png")
         .attr("id", d => "p-" + d.callsign)
         .attr("transform", d => getPlaneTransform(d))
         .attr("width", 8)
         .attr("height", 8)
         .on("mouseover", showDetails) // Show details on hover
         .on("mouseout", hideDetails)
         .transition() // Animate new planes with transition
         .duration(500); // Hide details on mouseout
 
     // Handle exiting planes (remove SVG elements)
     planes.exit()
     .transition() // Animate plane removal with transition
        .duration(500).remove();
drawInTheAirPlot();
drawAltPlot();
};

/* data fetching and transforming */
function createMap() {
    // https://leafletjs.com/examples/overlays/example-svg.html
    ctx.LFmap = L.map('LFmap');
    L.DomUtil.addClass(ctx.LFmap._container, 'crosshair-cursor-enabled');
    const tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: ctx.ATTRIB
    }).addTo(ctx.LFmap);
    ctx.LFmap.setView([0, 0], 2);
    ctx.LFmap.on('click', function (e) {
        showDetails(getClosestPlane(e.latlng));
    });
    L.svg().addTo(ctx.LFmap);
    let svgEl = d3.select("#LFmap").select("svg");
    svgEl.select("g")
        .attr("id", "planes");
    ctx.LFmap.on('zoom', function () { drawPlanes(false); });
};

function loadFlights() {
    let tMin = "00";
    loadPlanesFromLocalDump(`data/${ctx.ADSBX_PREFIX}${tMin}${ctx.ADSBX_SUFFIX}.json`, false);
    startPlaneUpdater(); // uncomment when reaching Section 2.2
}

function loadPlanesFromLocalDump(dumpPath, animate){
    // when resetting time, do not animate plane position
    ctx.filteredFlights = [];

    // when resetting time, do not animate plane position
    d3.select("img#inProg").style("visibility", "visible");
    console.log(`Querying local ADSBX dump ${dumpPath}...`);

    d3.json(dumpPath).then(
        function (data) {
            //XXX: TBW
            // prepare the data structure (Section 1)

            ctx.filteredFlights = []; // Clear previous data

            // Filter planes to only keep those flying above ctx.ALT_FLOOR
            const filteredAircraft = data.aircraft.filter(plane => 
                plane.alt_baro > ctx.ALT_FLOOR &&
                plane.lat != undefined &&
                plane.lon != undefined
            );

            // For each filtered plane, create a new object with required attributes
            filteredAircraft.forEach(plane => {
                const callsign = plane.flight ? plane.flight.trim() : ''; // Trim if flight exists, otherwise set to an empty string
                const filteredPlane = {
                    hex: plane.hex,
                    callsign: callsign,
                    lat: plane.lat,
                    lon: plane.lon,
                    bearing: plane.track,
                    alt: plane.alt_baro
                };
                ctx.filteredFlights.push(filteredPlane);
            });
            
           
            d3.select("img#inProg").style("visibility", "hidden");
            drawPlanes(false);
        }
    ).catch(function (err) { console.log(err); });
}

function showDetails(plane) {
    d3.select("#info").text(`Callsign: ${plane.callsign}`);

};

function getClosestPlane(cursorCoords) {
    let res = ctx.filteredFlights[0];
    let smallestDist = Math.pow(res.lon - cursorCoords.lng, 2) + Math.pow(res.lat - cursorCoords.lat, 2);
    for (let i = 1; i < ctx.filteredFlights.length; i++) {
        let dist = Math.pow(ctx.filteredFlights[i].lon - cursorCoords.lng, 2) + Math.pow(ctx.filteredFlights[i].lat - cursorCoords.lat, 2);
        if (dist < smallestDist) {
            res = ctx.filteredFlights[i];
            smallestDist = dist;
        }
    }
    let newSelection = d3.select(`#p-${res.callsign}`);
    if (ctx.selectedMark == null) {
        ctx.selectedMark = newSelection;
    }
    else {
        ctx.selectedMark.style("filter", "none");
        ctx.selectedMark.style("outline", "none");
        ctx.selectedMark = newSelection;
    }
    ctx.selectedMark.style("filter", "drop-shadow(0px 0px 1px rgb(128,0,128))");
    ctx.selectedMark.style("outline", "1px solid rgb(128,0,128,.5)");
    return res;
}

function toggleUpdate() {
    if (ctx.planeUpdater != null) {
        //XXX:TBW
        // Section 2.3
        ctx.planeUpdater = null;
        d3.select("#updateBt").attr("value", "Off");
    }
    else {
        //XXX:TBW
        // Section 2.3
        d3.select("#updateBt").attr("value", "On");
    }
};

function startPlaneUpdater() {
    ctx.planeUpdater = setInterval(
        function () {
            let tMin = String(LOCAL_DUMP_TIME_INDICES[LOCAL_DUMP_TIME_INC]).padStart(2, '0');
            loadPlanesFromLocalDump(`data/${ctx.ADSBX_PREFIX}${tMin}${ctx.ADSBX_SUFFIX}.json`, tMin != "00");
            if (LOCAL_DUMP_TIME_INC == LOCAL_DUMP_TIME_INDICES.length - 1) {
                LOCAL_DUMP_TIME_INC = 0;
            }
            else {
                LOCAL_DUMP_TIME_INC++;
            }
        },
        5000);
};
