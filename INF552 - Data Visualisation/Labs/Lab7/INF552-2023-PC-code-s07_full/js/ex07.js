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

const ALBERS_PROJ = d3.geoAlbersUsa().translate([ctx.w/2, ctx.h/2]).scale([1000]);

// https://github.com/d3/d3-force
const simulation = d3.forceSimulation()
                   .force("link", d3.forceLink()
                                    .id(function(d) { return d.id; })
                                    .distance(5).strength(0.08))
                   .force("charge", d3.forceManyBody())
                   .force("center", d3.forceCenter(ctx.w / 2, ctx.h / 2));

// https://github.com/d3/d3-scale-chromatic
const color = d3.scaleOrdinal(d3.schemeAccent);

function createGraphLayout(svg){
    // var lines = ...;

    // var circles = ...;

    circles.call(d3.drag().on("start", (event, d) => startDragging(event, d))
                          .on("drag", (event, d) => dragging(event, d))
                          .on("end", (event, d) => endDragging(event, d)));
};

function switchVis(showMap){
    if (showMap){
        // show network on map
        //...
    }
    else {
        // show NL diagram
        //...
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
    // ...
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
