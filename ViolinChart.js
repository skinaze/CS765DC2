createViolinChart = function(dataByTopic, intital) {
    var width = 800,
        height_perplot = 200,
        width_label = 500,
        margin_left = 20,
        margin_right = 20,
        margin_top = 20,
        margin_bottom = 40,
        margin_label = 40,
        bin_num = 600,
        dot_radius = 20,
        paddingMeasure = 0.20,
        paddingLabel = 0.2,
        labelRectSize = 20,
        xAxisTick = 11,
        measurement = ["chars_total", "textchars", "images", "resp"],
        measureName = ["Total characters", "Total text characters", "Image number per post", "Response number per post"];
    
    // Get discussion selection
    var disSelect = document.getElementById("disSelect")
    var dis = disSelect.options[disSelect.selectedIndex].value;
    
    // create the histogram
    var histogram = new Object;
    var measureMax = new Object;
    measurement.forEach(ms => { // The histogram function for each measurement
        measureMax[ms] = d3.max(dataByTopic,
            function(d){
                return d3.max(d[ms].change,
                    function(d){return Math.abs(d);});
            });
        histogram[ms] = d3.histogram()
            .domain([-measureMax[ms], measureMax[ms]])
            .thresholds(bin_num);
    });
    var distribution = new Object;
    dataByTopic.forEach(element => { // The histogram distribution
        distribution[element.key] = new Object;
        measurement.forEach(ms => { 
            distribution[element.key][ms] = histogram[ms](element[ms].change);// correct bin result
            distribution[element.key][ms].forEach((bin, index, array) => { // Mix density
                bin.density = 0;
                indexMin = (index-dot_radius>=0)?(index-dot_radius):0;
                indexMax = (index+dot_radius<=array.length)?(index+dot_radius):array.length;
                for (var i = indexMin; i<indexMax; i++) {
                    var scaleTemp = d3.scaleLinear()
                        .domain([i-dot_radius, i, i+dot_radius])
                        .range([0, array[i].length, 0]);
                    bin.density += scaleTemp(index);
                }
            });
            distribution[element.key][ms].maxDsty = d3.max(distribution[element.key][ms],
                function(d){return d.density;});
        });
        

    });
    

    // create scales
    var y = d3.scaleBand()
        .domain(measurement)
        .rangeRound([margin_top, margin_top+height_perplot*measurement.length])
        .padding([paddingMeasure]); // The y-scale of measurement categories
    var yBaseOnName = d3.scaleBand()
        .domain(measureName)
        .rangeRound([margin_top, margin_top+height_perplot*measurement.length])
        .padding([paddingMeasure]); // The y-scale of measurement categories using measureName as index
    var ySub = new Object;
    var x = new Object;
    var measureDstyMax = new Object;
    measurement.forEach(ms => { // The x-scale & y-scale of measurement
        measureDstyMax[ms] = d3.max(Object.values(distribution),
            function(d){return d[ms].maxDsty;});
        ySub[ms] = d3.scaleLinear()
            .domain([-measureDstyMax[ms], measureDstyMax[ms]])
            .range([y(ms)+y.bandwidth(), y(ms)]);
        x[ms] = d3.scaleLinear()
            .domain([-measureMax[ms], measureMax[ms]])
            .range([margin_left, margin_left+width]);
    });

    var initialDraw = function() {
        // Creating the svg
        d3.select("#ViolinChart").html([null]);
        var svg = d3.select("#ViolinChart").append('svg')
            .attr('width', width+margin_left+margin_right)
            .attr('height',height_perplot*measurement.length+margin_top+margin_bottom+margin_label);

        // Drawing axis
        var yAxis = d3.axisRight(yBaseOnName)
            .ticks(measurement.length)
            .tickValues(measureName); // y-axis
        svg.append('g')
            .attr('id','y-axis')
            .attr('transform', "translate("+(margin_left-8)+",-10)")
            .call(yAxis);
        var xAxis = new Object;
        measurement.forEach(ms => { // All the x-axis
            xAxis[ms] = d3.axisBottom(x[ms])
                .ticks(xAxisTick);
            svg.append('g')
                .attr('id', 'x-axis-'+ms)
                .attr('transform',"translate(0,"+ySub[ms](0)+")")
                .call(xAxis[ms]);
        });
        svg.append('g')
            .attr('id', 'zero-line')
            .append('line')
                .attr('x1', 0.5*width+margin_left)
                .attr('x2', 0.5*width+margin_left)
                .attr('y1', margin_top)
                .attr('y2', margin_top+height_perplot*measurement.length)
                .attr('stroke-dasharray', "4")
                .attr('stroke', "black")
                .attr('opacity', "1");

        // Drawing the area of chart
        var areaDraw = new Object;
        var chartArea = svg.append('g')
            .attr('id', 'charts');
        measurement.forEach(ms => {
            areaDraw[ms] = d3.area()
                .x(function(d){return x[ms]((d.x0+d.x1)*0.5);})
                .y0(function(d){return ySub[ms](d.density)})
                .y1(function(d){return ySub[ms](-d.density)});
            chartArea.append('path')
                .attr('d', areaDraw[ms](distribution[dis][ms]))
                .attr('fill', d3.schemeCategory10[0])
                .attr('opacity', "0.5")
                .attr('class', 'violin')
                .attr('id', 'violin-'+ms);
        });

        // Drawing labels
        labelArea = svg.append('g')
            .attr('id', 'labels');
        labelArea.append('path')
            .attr('d', 
                makeCurlyBrace(margin_left,
                    margin_top+height_perplot*measurement.length,
                    margin_left+0.5*width,
                    margin_top+height_perplot*measurement.length,
                    20,0.7
                )
            )
            .attr('opacity',"0.7")
            .attr('class', "curlyBrace");
        labelArea.append('text')
            .attr('x', margin_left+0.25*width)
            .attr('y', margin_top+height_perplot*measurement.length)
            .attr('dy',35)
            .attr('font-size',16)
            .attr('text-anchor',"middle")
            .text("Below Average");
        labelArea.append('path')
            .attr('d', 
                makeCurlyBrace(margin_left+0.5*width,
                    margin_top+height_perplot*measurement.length,
                    margin_left+width,
                    margin_top+height_perplot*measurement.length,
                    20,0.7
                )
            )
            .attr('opacity',"0.7")
            .attr('class', "curlyBrace");
        labelArea.append('text')
            .attr('x', margin_left+0.75*width)
            .attr('y', margin_top+height_perplot*measurement.length)
            .attr('dy',35)
            .attr('font-size',16)
            .attr('text-anchor',"middle")
            .text("Above Average");
    }

    var changeDiscussion = function() {
        // Redraw area of chart
        var svg = d3.select("#ViolinChart").select("svg");
        var chartArea = svg.select("#charts");
        var areaDraw = new Object;
        measurement.forEach(ms => {
            areaDraw[ms] = d3.area()
                .x(function(d){return x[ms]((d.x0+d.x1)*0.5);})
                .y0(function(d){return ySub[ms](d.density)})
                .y1(function(d){return ySub[ms](-d.density)});
            chartArea.select("#violin-"+ms)
                .transition()
                    .duration(1000)
                    .attr('d', areaDraw[ms](distribution[dis][ms]));
        });
    }
    
    if (intital) initialDraw();
    else changeDiscussion();
}

