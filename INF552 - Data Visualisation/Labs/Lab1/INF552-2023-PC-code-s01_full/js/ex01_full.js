const ctx = {
    SVG_NS: "http://www.w3.org/2000/svg",
    DEFAULT_POINT_COUNT: 20,
    GLYPH_SIZE: 20,
    w: 480,
    h: 480,
};

function randomGenerator(pointCount){
    let res = [];
    for (let i=0;i<pointCount;i++){
        res.push([Math.floor(Math.random()*(ctx.w-ctx.GLYPH_SIZE)) + ctx.GLYPH_SIZE/2.0,
                  Math.floor(Math.random()*(ctx.h-ctx.GLYPH_SIZE))+ ctx.GLYPH_SIZE/2.0]);
    }
    // console.log(res);
    return res;
};

function generateCircle(pos, color){
    let circle = document.createElementNS(ctx.SVG_NS, "circle");
    circle.setAttribute("cx", pos[0]);
    circle.setAttribute("cy", pos[1]);
    circle.setAttribute("r", ctx.GLYPH_SIZE/2.0);
    circle.setAttribute("fill", color);
    return circle;
};

function generateRectangle(pos, color){
    let rect = document.createElementNS(ctx.SVG_NS, "rect");
    rect.setAttribute("x", pos[0]-ctx.GLYPH_SIZE/2);
    rect.setAttribute("y", pos[1]-ctx.GLYPH_SIZE/2);
    rect.setAttribute("width", ctx.GLYPH_SIZE);
    rect.setAttribute("height", ctx.GLYPH_SIZE);
    rect.setAttribute("fill", color);
    return rect;
};

function populateSVGcanvas(pointCount, searchType){
    let svgEl = document.querySelector("svg");
    while (svgEl.firstChild) {
        svgEl.removeChild(svgEl.firstChild);
    }
    let gEl = document.createElementNS(ctx.SVG_NS, "g");
    gEl.setAttribute("id", "glyphs");
    svgEl.appendChild(gEl);
    if (searchType == "color"){
        let randomPoints = randomGenerator(pointCount-1);
        for (let i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateCircle(randomPoints[i], "blue"));
        }
        randomPoints = randomGenerator(1);
        gEl.appendChild(generateCircle(randomPoints[0], "red"));
    }
    else if (searchType == "shape"){
        let randomPoints = randomGenerator(pointCount-1);
        for (let i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateRectangle(randomPoints[i], "red"));
        }
        randomPoints = randomGenerator(1);
        gEl.appendChild(generateCircle(randomPoints[0], "red"));
    }
    else { // colorANDshape
        let randomPoints = randomGenerator(pointCount/2);
        for (let i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateRectangle(randomPoints[i], "red"));
        }
        randomPoints = randomGenerator(pointCount/2);
        for (let i=0;i<randomPoints.length;i++){
            gEl.appendChild(generateCircle(randomPoints[i], "blue"));
        }
        randomPoints = randomGenerator(1);
        gEl.appendChild(generateCircle(randomPoints[0], "red"));
    }
};

function createViz(){
    /* Method called automatically when the HTML page has finished loading. */
    // document.getElementById("countTf").setAttribute("value", ctx.DEFAULT_POINT_COUNT);
    document.querySelector("#countTf").setAttribute("value", ctx.DEFAULT_POINT_COUNT);
    // let mainDiv = document.getElementById("main");
    let mainDiv = document.querySelector("#main");
    let svgEl = document.createElementNS(ctx.SVG_NS, "svg");
    svgEl.setAttribute("width", ctx.w);
    svgEl.setAttribute("height", ctx.h);
    mainDiv.appendChild(svgEl);
    let footerEl = document.createElement("div");
    footerEl.setAttribute("class", "footer");
    footerEl.appendChild(document.createTextNode(`Generated with neither D3 v${d3.version} nor Vega-Lite v${vegaEmbed.vegaLite.version}`));
    mainDiv.appendChild(footerEl);
    set();
};

let handleKeyEvent = function(e){
    /* Callback triggered when any key is pressed in the input text field.
       e contains data about the event.
       visit http://keycode.info/ to find out how to test for the right key value */
    if (e.keyCode === 13){
        // enter
        e.preventDefault();
        set();
    }
};

let set = function(){
    /* Callback triggered when the "Set" button is clicked. */
    // let count = document.getElementById('countTf').value;
    let count = document.querySelector('#countTf').value;
    if (count.trim()===''){
        return;
    }
    // let searchType = document.getElementById('searchType').value;
    let searchType = document.querySelector('#searchType').value;
    populateSVGcanvas(parseInt(count), searchType);
};
