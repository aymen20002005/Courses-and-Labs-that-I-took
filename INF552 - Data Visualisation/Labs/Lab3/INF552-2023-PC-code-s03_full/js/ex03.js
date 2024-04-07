const ctx = {
  sampleSize : '*',
  scaleTypeSP : 'linear',
  DETECTION_METHODS_RVPT: ["Radial Velocity", "Primary Transit"],
  DETECTION_METHODS_ALL4: ["Radial Velocity", "Primary Transit",
                           "Microlensing", "Imaging"],
  DM_COLORS: ['#cab2d6', '#fdbf6f', '#b2df8a', '#fb9a99']
}

let createMassScatterPlot = function(scaleType, sampleSize){
    /* scatterplot: planet mass vs. star mass
       showing year of discovery using color,
       and detection method using shape,
       to be sync'ed with line bar chart below (brushing and linking) */
    // let vlSpec = {
    //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    //     "data": {
    //         //...
    //     },
    //     //...
    // };
    // // see options at https://github.com/vega/vega-embed/blob/master/README.md
    // let vlOpts = {width:700, height:700, actions:false};
    // vegaEmbed("#massScat", vlSpec, vlOpts);
};

let createMagV2DHisto = function(){
    /* 2D histogram in the bottom-right cell,
       showing V-magnitude distribution (binned)
       for each detection_method */
    // vlSpec = {
    //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    //     "data": {
    //         //...
    //     },
    //     //...
    // };
    // vlOpts = {width:300, height:300, actions:false};
    // vegaEmbed("#vmagHist", vlSpec, vlOpts);
};

let createDetectionMethodLinePlot = function(){
    // line plot: planet discovery count vs. year
    // vlSpec = {
    //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    //     "data": {
    //         //...
    //     },
    //     //...
    // };
    // vlOpts = {width:300, height:300, actions:false};
    // vegaEmbed("#discPlot", vlSpec, vlOpts);
};

let createViz = function(){
    vega.scheme("dmcolors", ctx.DM_COLORS);
    createMassScatterPlot(ctx.scaleTypeSP, '*');
    createMagV2DHisto();
    createDetectionMethodLinePlot();
};

let handleKeyEvent = function(e){
    if (e.keyCode === 13){
        // enter
        e.preventDefault();
        setSample();
    }
};

let updateScatterPlot = function(){
    createMassScatterPlot(ctx.scaleTypeSP, ctx.sampleSize);
};

let setScaleSP = function(){
    ctx.scaleTypeSP = document.querySelector('#scaleSelSP').value;
    updateScatterPlot();
};

let setSample = function(){
    let sampleVal = document.querySelector('#sampleTf').value;
    if (sampleVal.trim()===''){
        return;
    }
    ctx.sampleSize = sampleVal;
    updateScatterPlot();
};
