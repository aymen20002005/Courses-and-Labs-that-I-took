const ctx = {
    w: 1280,
    h: 720,
};

// clipping
function clipText(svg) {
  svg.selectAll(".leaf").append("clipPath")
     .attr("id", d => "clip-" + d.data.id)
     .append("use")
     .attr("xlink:href", d => "#" + d.data.id);
  d3.selectAll(".leaf text")
    .attr("clip-path", d => `url(#clip-${d.data.id})`);
}

function sumByCount(d) {
    return d.Amount;
}

function createTreemap(data, svg){
    // ...
    let fader = function(c){return d3.interpolateRgb(c, "#fff")(0.6);}
    let colorScale = d3.scaleOrdinal(d3.schemeCategory10.map(fader));
    
    let root = d3.stratify()
                .id(d => d.Code)
                .parentId(d => {
                    if (d.Level > 1) {
                        return d.Code.slice(0, -2);
                    }
                    else if (d.Level == 1) {
                        return "COFOG";
                    }
                    else {
                        return null;
                    }
                })(data)
    
    let treemap = d3.treemap()
                    .tile(d3.treemapBinary)
                    .size([ctx.w, ctx.h])
                    .paddingInner(5)
                    .paddingOuter(5);

    root.eachBefore(d => d.data.id = d.data.Code);
    root.sum(sumByCount);

    treemap(root);

    let nodes = svg.selectAll("g")
                   .data(root.descendants())
                   .enter().append("g")
                   .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
                   .classed("leaf", d => d.children == null);

    nodes.append("rect")
         .attr("id", d => d.data.id)
         .attr("width", d => d.x1 - d.x0)
         .attr("height", d => d.y1 - d.y0)
         .style("fill", d => colorScale(d.data.Code.slice(0, 4)))
         .style("stroke", "black")

    d3.selectAll(".leaf").append("text")
        .style("fill", d => tinycolor(colorScale(d.data.Code.slice(0, 4))).darken(40).toString())
        .selectAll("tspan")
        .data(d => d.data.Description.split(" "))
        .enter().append("tspan")
        .attr("x", 4)
        .attr("y", (d, i) => 13 + i*10)
        .text(d => d)
    
    nodes
        .append("title")
        .text((d) => d.data.Description)
    clipText(svg);
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

function loadData(svgEl){
    // load cofog.csv
    // and call createTreemap(...) passing this data and svgEL
    d3.csv('data/cofog.csv')
        .then((data) => {
            data.push({
                "Level": 0,
                "Code": "COFOG",
                "Description": "",
                "Amount": ""
            })

            createTreemap(data, svgEl);
        })
};
