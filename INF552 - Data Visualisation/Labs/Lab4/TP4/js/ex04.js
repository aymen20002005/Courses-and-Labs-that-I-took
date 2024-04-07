const ctx = {
    w: 820,
    h: 720,
    JITTER_W:10,
    X_ALL:120,
    X_SPACING:80,
    GLYPH_SIZE:16,
    STROKE_W:2
};

let circleGen = d3.symbol().type(d3.symbolCircle)
				  .size(ctx.GLYPH_SIZE);

// code for Section 4 (optional)
// data = array of stars with their attributes
// sG = d3 reference to the <g> element
//      for the corresponding spectral type
function densityPlot(data, sG){
    let tEffs = data.map(function (p) { return p.Teff; });
    let tEffScale = d3.scaleLinear()
                             .domain(/*some domain*/)
                             .range(/*some range*/);
    let n = tEffs.length,
        density = kernelDensityEstimator(kernelEpanechnikov(7), tEffScale.ticks(50))(tEffs);
    let maxDensity = d3.max(density, (d) => (d[1]));
    let densityScale = d3.scaleLinear()
        .domain([0, maxDensity])
        .range([0, ctx.JITTER_W * 0.8]);
    // remove entries where y=0 to avoid unnecessarily-long tails
    let i = density.length - 1;
    let lastNonZeroBucket = -1;
    while (i >= 0) {
        // walk array backward, find last entry >0 at index n, keep n+1
        if (density[i][1] > 0) {
            lastNonZeroBucket = i;
            break;
        }
        i--;
    }
    if (lastNonZeroBucket != -1) {
        density = density.splice(0, lastNonZeroBucket + 3);
    }
    // insert a point at 0,0 so that the path fill does not cross the curve
    density.unshift([0, 0]);
    // now draw the density curve
    // TBW ...
};

function initSVGcanvas(starData){
    // scale Teff -> y-axis
    let minTeff = d3.min(starData, ((d) => parseFloat(d.Teff)))
    let maxTeff = d3.max(starData, ((d) => parseFloat(d.Teff)))
    ctx.yScale = d3.scaleLinear().domain([0, maxTeff])
                                 .range([ctx.h-60, 20]);
    d3.select("#bkgG").append("g")
        .attr("transform", "translate(60,0)")
        .call(d3.axisLeft(ctx.yScale).ticks(10))
        .selectAll("text")
        .style("text-anchor", "end");
    d3.select("#bkgG")
        .append("text")
        .attr("y", 0)
        .attr("x", 0)
        .attr("transform", `rotate(90) translate(-${ctx.h/2},8)`)
        .classed("axisLb", true)
        .text("Estimated effective temperature (K)");

}

function plotAllData(allData){
    // Plot raw distribution of all stars
    d3.select("#raw")
        .append("text")
        .attr("transform", `rotate(90) translate(${ctx.X_ALL}, ${ctx.h - 40})`)
        .style("text-anchor", "middle")
        .text("Raw")
        

    d3.select("#raw")
        .selectAll("path")
        .data(allData)
        .enter()
        .append("path")
        .attr("d", circleGen())
        .attr("transform", `translate(100,0)`)
        .attr("transform", function(d){
            return starTranslator(true, d.Teff);
        })
}

function plotStarDistributionByST(allData){
    // Plot Teff distribution per spectral type
    let starsByST = d3.group(allData, (d) => (d.SpType_ELS));
    let xoffset = ctx.X_ALL;
    starsByST.forEach((stars, st) => {
        if (stars.length > 1){
            xoffset += ctx.X_SPACING;
            plotStarDistribution(st, stars, xoffset);
        }
    });
};

function plotStarDistribution(spectralType, stars, centerX){
    let starsG = d3.select("#rootG").append("g")
                           .attr("id", spectralType.replace(/\s/g,''))
                           .attr("transform", `translate(${centerX},0)`);
    // label
    starsG.append("text")
            .datum(spectralType)
            .attr("transform", `translate(0,${ctx.h-40})`)
            .style("text-anchor", "middle")
            .text((d) => (`${d} type`));

    starsG.selectAll("path")
            .data(stars)
            .enter()
            .append("path")
            .attr("d", circleGen())
            .attr("transform", function(d){
                return starTranslator(false, d.Teff);
            })
            .attr("fill", "orange");


};


function starTranslator(is_raw, Teff) {
    var x_jitter = (is_raw + 1)*(Math.random()*2 - 1) * ctx.JITTER_W
                        + is_raw * ctx.X_ALL
    return `translate(${x_jitter},${ctx.yScale(Teff)})`;
}

function plotBoxByST(allData){
    // Plot Box Plot for each star
    let starsByST = d3.group(allData, (d) => (d.SpType_ELS));
    let xoffset = ctx.X_ALL;
    starsByST.forEach((stars, st) => {
        if (stars.length > 1){
            xoffset += ctx.X_SPACING;
            let summaryStar = getSummaryStatistics(stars)
            plotBox(st, summaryStar);
        }
    });
}

function plotBox(spectralType, summary){
    let box = d3.select(`#${spectralType[0]}`)
    

    // Plot the box of quartiles
    box.append("rect")
            .datum(summary)
            .attr('x', -2*ctx.JITTER_W)
            .attr('y', (d) => (ctx.yScale(d.q3)))
            .attr('width', 4*ctx.JITTER_W)
            .attr('height', (d) => (ctx.yScale(d.q1) - ctx.yScale(d.q3)))
            .attr('stroke', 'red')
            .attr('stroke-width', ctx.STROKE_W)
            .attr('fill', 'none')

    // Plot min to q1 line
    box.append("line")
            .datum(summary)
            .attr('x1', 0)
            .attr('y1', (d) => (ctx.yScale(d.min)))
            .attr('x2', 0)
            .attr('y2', (d) => (ctx.yScale(d.q1)))
            .attr('stroke', 'red')
            .attr('stroke-width', ctx.STROKE_W)

    // Plot q3 to max line
    box.append("line")
            .datum(summary)
            .attr('x1', 0)
            .attr('y1', (d) => (ctx.yScale(d.q3)))
            .attr('x2', 0)
            .attr('y2', (d) => (ctx.yScale(d.max)))
            .attr('stroke', 'red')
            .attr('stroke-width', ctx.STROKE_W)

    // Plot median line
    box.append("line")
            .datum(summary)
            .attr('x1', -2*ctx.JITTER_W)
            .attr('y1', (d) => (ctx.yScale(d.median)))
            .attr('x2', +2*ctx.JITTER_W)
            .attr('y2', (d) => (ctx.yScale(d.median)))
            .attr('stroke', 'red')
            .attr('stroke-width', ctx.STROKE_W)

    // Plot min whisker
    box.append("line")
            .datum(summary)
            .attr('x1', -ctx.JITTER_W)
            .attr('y1', (d) => (ctx.yScale(d.min)))
            .attr('x2', +ctx.JITTER_W)
            .attr('y2', (d) => (ctx.yScale(d.min)))
            .attr('stroke', 'red')
            .attr('stroke-width', ctx.STROKE_W)
    
    // Plot max whisker
    box.append("line")
            .datum(summary)
            .attr('x1', -ctx.JITTER_W)
            .attr('y1', (d) => (ctx.yScale(d.max)))
            .attr('x2', +ctx.JITTER_W)
            .attr('y2', (d) => (ctx.yScale(d.max)))
            .attr('stroke', 'red')
            .attr('stroke-width', ctx.STROKE_W)

}

function loadData() {
    d3.csv("data/sample_gaia_DR3.csv").then(function (data) {
        let starsWithTeff = data.filter((d) => (parseFloat(d.Teff) > 0));
        starsWithTeff.forEach(
            (d) => { d.Teff = parseFloat(d.Teff); }
        );
        
        initSVGcanvas(starsWithTeff)
        plotAllData(starsWithTeff)
        plotStarDistributionByST(starsWithTeff)
        plotBoxByST(starsWithTeff)
    }).catch(function(error){console.log(error)});
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    var rootG = svgEl.append("g").attr("id", "rootG");
    // group for background elements (axes, labels)
    rootG.append("g").attr("id", "bkgG");
    // group for raw distribution of all stars
    rootG.append("g").attr("id", "raw")

    loadData();
};

/*-------------- Summary stats for box plot ------------------------*/
/*-------------- see Instructions/Section 3 ----------------------*/

function getSummaryStatistics(data) {
    return d3.rollup(data, function (d) {
        let q1 = d3.quantile(d.map(function (p) { return p.Teff; }).sort(d3.ascending), .25);
        let median = d3.quantile(d.map(function (p) { return p.Teff; }).sort(d3.ascending), .5);
        let q3 = d3.quantile(d.map(function (p) { return p.Teff; }).sort(d3.ascending), .75);
        let iqr = q3 - q1;
        let min = d3.min(data, (d) => (d.Teff));
        let max = d3.max(data, (d) => (d.Teff));
        return ({ q1: q1, median: median, q3: q3, iqr: iqr, min: min, max: max })
    });
};

/*-------------- kernel density estimator ------------------------*/
/*-------------- see Instructions/Section 4 ----------------------*/

function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}

function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}