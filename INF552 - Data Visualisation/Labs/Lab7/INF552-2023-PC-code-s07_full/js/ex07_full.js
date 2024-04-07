const ctx = {
    w: 800,
    h: 800,
    mapMode: false,
    MIN_COUNT: 3000,
    ANIM_DURATION: 600, // ms
    NODE_SIZE_NL: 5,
    NODE_SIZE_MAP: 3,
    LINK_ALPHA: 0.2,
    nodes: [],
    links: [],
};

const QUAD_ANGLE = Math.PI / 6.0;

const ALBERS_PROJ = d3.geoAlbersUsa().translate([ctx.w/2, ctx.h/2]).scale([1000]);
const geoPathGen = d3.geoPath().projection(ALBERS_PROJ);

// https://github.com/d3/d3-force
const simulation = d3.forceSimulation()
                   .force("link", d3.forceLink()
                                    .id(function(d) { return d.id; })
                                    .distance(5).strength(0.08))
                   .force("charge", d3.forceManyBody())
                   .force("center", d3.forceCenter(ctx.w / 2, ctx.h / 2));

// https://github.com/d3/d3-scale-chromatic
const color = d3.scaleOrdinal(d3.schemeAccent);

function restructureData(airports, flights, states_tz){
    let state2tz = {};
    states_tz.forEach(
        function(d){
            state2tz[d.State] = d.TimeZone;
        }
    );
    let connected = {};
    flights.forEach(
        function(d){
            if (d.count > ctx.MIN_COUNT && isNaN(d.origin.charAt(0)) && isNaN(d.destination.charAt(0))){
                ctx.links.push({source: d.origin, target: d.destination, value: d.count});
                connected[d.origin] = 1;
                connected[d.destination] = 1;
            }
        }
    );
    ctx.wScale = d3.scaleLinear().domain([ctx.MIN_COUNT,
                                          d3.max(ctx.links, function(d){return d.value;})])
                                 .range([1, 10]);
    airports.forEach(
        function(d){
            if (isNaN(d.iata.charAt(0)) && d.iata in connected){
                let coords = ALBERS_PROJ([d.longitude, d.latitude]);
                if (!coords){
                    // handle specific case of San Juan (SJU),
                    // which is out of bounds for the Albers projection
                    coords = [ctx.w-10, ctx.h-10];
                }
                ctx.nodes.push({id:d.iata,
                                group:state2tz[d.state],
                                state:d.state,
                                city:d.city,
                                lonlat: coords});
            }
        }
    );
    d3.select("#main")
      .append("div")
      .attr("class","counts")
      .text("Airports: "+ctx.nodes.length+", Flights:"+ctx.links.length);
};

function createGraphLayout(svg){

    console.log(ctx.nodes);

    console.log(ctx.links);

    let lines = svg.append("g")
                   .attr("id", "links")
                   .attr("opacity", ctx.LINK_ALPHA)
                   .selectAll("path")  // simpler version uses <line>
                   .data(ctx.links)
                   .enter()
                   .append("path");    // simpler version uses <line>
                   // .attr("stroke-width", (d) => (ctx.wScale(d.value)));

    let circles = svg.append("g")
                     .attr("id", "nodes")
                     .selectAll("circle")
                     .data(ctx.nodes)
                     .enter()
                     .append("circle")
                     .attr("r", ctx.NODE_SIZE_NL)
                     .attr("fill", (d) => (color(d.group)));

    circles.append("title")
           .text(function(d) { return d.city + " (" + d.id + ")"; });

    circles.call(d3.drag().on("start", (event, d) => startDragging(event, d))
                          .on("drag", (event, d) => dragging(event, d))
                          .on("end", (event, d) => endDragging(event, d)));

    simulation.nodes(ctx.nodes)
              .on("tick", simStep);

    simulation.force("link")
              .links(ctx.links);

    function simStep(){
        // code run at each iteration of the simulation
        updateNLLinks();
        circles.attr("cx", (d) => (d.x))
               .attr("cy", (d) => (d.y));
    }
};

function getCurve(x1, y1, x2, y2){
    let alpha = Math.atan2(y2-y1, x2-x1);
    let ds = Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2)) / 2.0;
    let rho = ds / Math.cos(QUAD_ANGLE);
    let cpx = x1 + rho*Math.cos(alpha+QUAD_ANGLE);
    let cpy = y1 + rho*Math.sin(alpha+QUAD_ANGLE);
    return `M${x1},${y1}Q${cpx},${cpy} ${x2},${y2}`;
};

function updateNLLinks(){
    d3.selectAll("#links path")
      .attr("d", (d) => (getCurve(d.source.x, d.source.y, d.target.x, d.target.y)));
    // below: simpler version using <line> segments
    // d3.selectAll("#links line")
    //   .attr("x1", (d) => (d.source.x))
    //   .attr("y1", (d) => (d.source.y))
    //   .attr("x2", (d) => (d.target.x))
    //   .attr("y2", (d) => (d.target.y));
};

function updateGeoLinks(){
    d3.selectAll("#links path")
      .attr("d", (d) => (getCurve(d.source.lonlat[0],
                                  d.source.lonlat[1],
                                  d.target.lonlat[0],
                                  d.target.lonlat[1])));
    // below: simpler version using <line> segments
    // d3.selectAll("#links line")
    //      .attr("x1", (d) => (d.source.lonlat[0]))
    //      .attr("y1", (d) => (d.source.lonlat[1]))
    //      .attr("x2", (d) => (d.target.lonlat[0]))
    //      .attr("y2", (d) => (d.target.lonlat[1]));
};

function createMap(topojson, svg){
    let map = svg.append("g")
                 .attr("id", "map")
                 .attr("opacity", 0);
    map.selectAll("path")
       .data(topojson.features)
       .enter()
       .append("path")
       .attr("d", geoPathGen)
       .classed("state", true);
};

function switchVis(showMap){
    if (showMap){
        // show network on map
        simulation.stop();
        d3.select("#links")
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("opacity", 0)
          .on("end", function(d){updateGeoLinks();})
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("opacity", ctx.LINK_ALPHA);
        d3.selectAll("#nodes circle")
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("cx", (d) => (d.lonlat[0]))
          .attr("cy", (d) => (d.lonlat[1]))
          .attr("r", ctx.NODE_SIZE_MAP);
        d3.select("#map")
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("opacity", 1);
    }
    else {
        // show NL diagram
        d3.select("#links")
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("opacity", 0)
          .on("end", function(d){updateNLLinks();})
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("opacity", ctx.LINK_ALPHA);
        d3.selectAll("#nodes circle")
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("cx", (d) => (d.x))
          .attr("cy", (d) => (d.y))
          .attr("r", ctx.NODE_SIZE_NL);
        d3.select("#map")
          .transition()
          .duration(ctx.ANIM_DURATION)
          .attr("opacity", 0);
    }
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    d3.select("body")
      .on("keydown", function(event, d){handleKeyEvent(event);});
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

function loadData(svgEl){
    let promises = [d3.json("data/airports.json"),
                    d3.json("data/flights.json"),
                    d3.csv("data/states_tz.csv"),
                    d3.json("data/us-states.geojson")];
    Promise.all(promises).then(function(data){
        createMap(data[3], svgEl);
        restructureData(data[0], data[1], data[2]);
        createGraphLayout(svgEl);
    }).catch(function(error){console.log(error)});
};

function startDragging(event, node){
    if (ctx.mapMode){return;}
    if (!event.active){
        simulation.alphaTarget(0.3).restart();
    }
    node.fx = node.x;
    node.fy = node.y;
}

function dragging(event, node){
    if (ctx.mapMode){return;}
    node.fx = event.x;
    node.fy = event.y;
}

function endDragging(event, node){
    if (ctx.mapMode){return;}
    if (!event.active){
        simulation.alphaTarget(0);
    }
    // commenting the following lines out will keep the
    // dragged node at its current location, permanently
    // unless moved again manually
    node.fx = null;
    node.fy = null;
}

function handleKeyEvent(e){
    if (e.keyCode === 84){
        // hit T
        toggleMap();
    }
};

function toggleMap(){
    ctx.mapMode = !ctx.mapMode;
    switchVis(ctx.mapMode);
};
