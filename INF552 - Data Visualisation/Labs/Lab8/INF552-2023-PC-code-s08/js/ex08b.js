const ctx = {
    w: 1200,
    h: 1200,
};

function radialPoint(x, y) {
    return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
}

function createRadialTree(data, svg){
    // let fader = function(c){return d3.interpolateRgb(c, "#fff")(0.6);}
    let colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    let g = svg.append("g").attr("transform", "translate(" + (ctx.w / 2) + "," + (ctx.h / 2) + ")");

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

    var tree = d3.tree()
        .size([2 * Math.PI, 500])
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

    tree(root);

    var link = g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .style("stroke", (d) => colorScale(d.source.id.slice(0, 4)))
        .attr("d", d3.linkRadial()
            .angle(function(d) { return d.x; })
            .radius(function(d) { return d.y; }));

    var node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
            .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
            .attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")"; })
            .style("fill", (d) => colorScale(d.id.slice(0, 4)));
        
    node.append("circle")
        .attr("r", 2.5)
        .style("fill", (d) => colorScale(d.id.slice(0, 4)));

    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
        .attr("text-anchor", function(d) { return d.x < Math.PI === !d.children ? "start" : "end"; })
        .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")"; })
        .text(function(d) { return d.data.Description.length > 20 ? d.data.Description.substring(0, 17) + '...' : d.data.Description})
        .append("title")
        .text(function(d) { return d.data.Description});
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    loadData(svgEl);
};

function loadData(svgEl){
    d3.csv('data/cofog.csv').then((data) => {
        data.push({
            "Level": 0,
            "Code": "COFOG",
            "Description": "",
            "Amount": ""
        })

        createRadialTree(data, svgEl);
    })
};
