const ctx = {
    SVG_W: 1024,
    SVG_H: 1024,
    YEAR: "2018",
};

function loadData(svgEL) {
    Promise.all([
        d3.json("data/gra.geojson"),
        d3.json("data/nutsrg.geojson"),
        d3.json("data/nutsbn.geojson"),
        d3.json("data/cntrg.geojson"),
        d3.json("data/cntbn.geojson"),
        d3.csv("data/pop_density_nuts3.csv")
    ]).then(function(data) {
        let graticule = data[0];
        let nutsrg = data[1];
        let nutsbn = data[2];
        let cntrg = data[3];
        let cntbn = data[4];
        let popDensity = data[5];


    nutsrg.features.forEach(nuts3Feature => {
        const nuts3ID = nuts3Feature.properties.id;
        const year = ctx.YEAR; // Set to the desired year

        // Filter pop_density_nuts3.csv data to find the matching row
        const matchingRow = popDensity.find(row => row.geo === nuts3ID && row.TIME_PERIOD === ctx.YEAR);
    
        if (matchingRow) {
            
        // If a matching row is found, add OBS_VALUE as a new property in the GeoJSON feature
        nuts3Feature.properties.density = matchingRow.OBS_VALUE;
        }
    });
    
    
        // console.log(popDensityData);
        console.log(nutsrg);
        drow_map(svgEL,graticule,nutsrg,nutsbn,cntrg,cntbn);
      })
      .catch(function (error) {
        console.error("Error loading files:", error);
      });
  }
  
function drow_map(svgEL,graData,nutsrgData,nutsbnData,cntrgData,cntbnData) {

  ctx.proj = d3.geoIdentity()
    .reflectY(true)
    .fitSize([ctx.SVG_H, ctx.SVG_H], graData);
   
    
  let geoPathGen = d3.geoPath(ctx.proj);
  
        // Coloring NUTS3 regions according to population density
        let densityLogScale = d3.scaleLog()
            .domain([1, d3.max(nutsrgData.features, d => d.properties.density)]);

        let colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([densityLogScale(1), densityLogScale(d3.max(nutsrgData.features, d => d.properties.density))]);

            
        // Draw NUTS3 regions
        svgEL.selectAll(".nutsArea")
            .data(nutsrgData.features)
            .enter().append("path")
            .attr("d", geoPathGen)
            .attr("class", "nutsArea")
            .style("fill", d => {
              return d.properties.density ? colorScale(densityLogScale(d.properties.density)) : "#ccc";
          });
        // Draw NUTS3 borders
        svgEL.selectAll(".nutsBorder")
          .data(nutsbnData.features)
          .enter().append("path")
          .attr("d", geoPathGen)
          .attr("class", "nutsBorder");

          // Putting other countries on the map
        svgEL.selectAll(".countryArea")
        .data(cntrgData.features)
        .enter().append("path")
        .attr("d", geoPathGen)
        .attr("class", "countryArea")
        .style("fill","#DCDCDC");
    // Draw borders
    svgEL.selectAll(".countryBorder")
      .data(cntbnData.features)
      .enter().append("path")
      .attr("d", geoPathGen)
      .attr("class", "countryBorder");
  
}; 

function createViz() {
    console.log("Using D3 v" + d3.version);
    let svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.SVG_W);
    svgEl.attr("height", ctx.SVG_H);
    
    loadData(svgEl);
};

