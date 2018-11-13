createBoxChart = function (dataByTopic) {
    var width = 800,
        height = 400,
        width_label = 750,
        margin_left = 20,
        margin_right = 20,
        margin_top = 20,
        margin_bottom = 40,
        margin_label = 40,
        paddingTopic = 0.06,
        paddingMeasure = 0.20,
        paddingLabel = 0.2,
        boxLineShrink = 2,
        boxOutlierRaius = 2,
        showOutlierLabel = false,
        circleRadius = 8,
        labelRectSize = 20,
        measurement = ["chars_total", "textchars", "images", "resp"],
        measureName = {chars_total: "Total characters", textchars: "Total text characters", images: "Image number per post", resp: "Response number per post"};
    
    // Create scales
    var x = d3.scaleBand()
        .domain(dataByTopic.topicList)
        .rangeRound([margin_left,width+margin_left])
        .padding([paddingTopic]); // The overall x-scale
    var topicScale = new Object; // Horizontal scale for each topic
    var range = new Object; // The vertical range
    range.chars_total = new Object;
    range.chars_total.bottom = 0;
    range.textchars = new Object;
    range.textchars.bottom = 0;
    range.images = new Object;
    range.images.bottom = 0;
    range.resp = new Object;
    range.resp.bottom = 0;
    dataByTopic.forEach(element => {
        // Set the horizontal scale
        tempScale = d3.scaleBand()
            .domain(measurement)
            .rangeRound([x(element.key), x(element.key)+x.bandwidth()])
            .padding([paddingMeasure]);
        topicScale[element.key] = tempScale;
        // Set top and bottom for each measurement
        if (typeof range.chars_total.top == 'undefined') range.chars_total.top = element.chars_total.top;
        else if (range.chars_total.top < element.chars_total.top) range.chars_total.top = element.chars_total.top;
        if (typeof range.textchars.top == 'undefined') range.textchars.top = element.textchars.top;
        else if (range.textchars.top < element.textchars.top) range.textchars.top = element.textchars.top;
        if (typeof range.images.top == 'undefined') range.images.top = element.images.avg;
        else if (range.images.top < element.images.avg) range.images.top = element.images.avg;
        if (typeof range.resp.top == 'undefined') range.resp.top = element.resp.avg;
        else if (range.resp.top < element.resp.avg) range.resp.top = element.resp.avg;
    });
    range.chars_total.top = Math.round(range.chars_total.top*1.1); // Scale up maxinum to 1.1 times
    range.textchars.top = Math.round(range.textchars.top*1.1); // Scale up maxinum to 1.1 times
    range.images.top = Math.round(range.images.top*1000*1.1)/1000; // Scale up maxinum to 1.1 times
    range.resp.top = Math.round(range.resp.top*1000*1.1)/1000; // Scale up maxinum to 1.1 times
    var y = new Object; // Different y scale for different measurement
    y.chars_total = d3.scaleLinear()
        .domain([range.chars_total.bottom, range.chars_total.top])
        .range([height+margin_top, margin_top]); // chars_total measurement
    y.textchars = d3.scaleLinear()
        .domain([range.textchars.bottom, range.textchars.top])
        .range([height+margin_top, margin_top]); // textchars measurement
    y.images = d3.scaleLinear()
        .domain([range.images.bottom, range.images.top])
        .range([height+margin_top, margin_top]); // images measurement
    y.resp = d3.scaleLinear()
        .domain([range.resp.bottom, range.resp.top])
        .range([height+margin_top, margin_top]); //resp measurement
    var measureColor = d3.scaleOrdinal()
        .domain(measurement)
        .range(d3.schemeCategory10); // measurement color scale
    var background = d3.scaleOrdinal()
        .domain(dataByTopic.topicList)
        .range(["#deebf7","#c6dbef"]); // The background color
    var labelsScale = d3.scaleBand()
        .domain(measurement)
        .rangeRound([margin_left+0.5*width-0.5*width_label, margin_left+0.5*width+0.5*width_label])
        .padding([paddingTopic]);
        
    
    // Creating the svg
    d3.select("#BoxChart").html([null]);
    var svg = d3.select("#BoxChart").append('svg')
        .attr('width', width+margin_left+margin_right)
        .attr('height',height+margin_top+margin_bottom+margin_label);
    
    // Drawing axis
    var xAxis = d3.axisBottom(x)
        .ticks(dataByTopic.topicList.length);
    svg.append('g')
        .attr('id','x-axis')
        .attr('transform', "translate(0,"+(height+margin_top)+")")
        .call(xAxis);
    svg.select('#x-axis').append('text')
        .attr('x', 0.5*width+margin_left)
        .attr('y', 0)
        .attr('dy', '2em')
        .attr('fill', "black")
        .attr('font-size', 16)
        .attr('text-anchor', "middle")
        .text("Discussion ID");
    
    // Drawing data points
    var drawBox = function(d3select, data, className) { // Draw box function
        var selectEnter = d3select.selectAll('.'+className).data(data).enter();
        selectEnter.append('line') // The center vertical line
            .attr('x1', function(d){return topicScale[d.key](className)+0.5*topicScale[d.key].bandwidth();}) // x1 is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('y1', function(d){return y[className](d[className].boxTop);}) // y1 is from the class y scale of the top to this disccussion
            .attr('x2', function(d){return topicScale[d.key](className)+0.5*topicScale[d.key].bandwidth();}) // x2 is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('y2', function(d){return y[className](d[className].boxBottom);}) // y2 is from the class y scale of the bottom to this disccussion
            .attr('stroke', measureColor(className))
            .attr('stroke-dasharray', "2")
            .attr('class', className);
        selectEnter.append('rect') // The rectangle part
            .attr('x', function(d){return topicScale[d.key](className);}) // x is from the topicScale of this discussion id
            .attr('y', function(d){return y[className](d[className].t25);}) // y is from the class y scale of the t25 to this disccussion
            .attr('width', function(d){return topicScale[d.key].bandwidth();}) // width is from the topicScale bandwidth of this discussion id
            .attr('height',function(d){return y[className](d[className].b25)-y[className](d[className].t25);}) // heights is from the subtraction between the class y scale of the b25 and t25 to this discussion
            .attr('fill', measureColor(className))
            .attr('class', className);
        selectEnter.append('text') // The t25 number
            .attr('x', function(d){return topicScale[d.key](className);}) // x is from the topicScale of this discussion id
            .attr('y', function(d){return y[className](d[className].t25);}) // y is from the class y scale of the t25 to this disccussion
            .text(function(d){return d[className].t25})
            .attr('dy', "0em")
            .attr('text-anchor', "start")
            .attr('class', className);
        selectEnter.append('text') // The b25 number
            .attr('x', function(d){return topicScale[d.key](className);}) // x is from the topicScale of this discussion id
            .attr('y', function(d){return y[className](d[className].b25);}) // y is from the class y scale of the b25 to this disccussion
            .text(function(d){return d[className].b25})
            .attr('dy', "0.7em")
            .attr('text-anchor', "start")
            .attr('class', className);
        selectEnter.append('line') // The top line
            .attr('x1', function(d){return topicScale[d.key](className)+0.5*boxLineShrink;}) // x1 is from the topicScale of this discussion id
            .attr('y1', function(d){return y[className](d[className].boxTop);}) // y1 is from the class y scale of the top to this disccussion
            .attr('x2', function(d){return topicScale[d.key](className)+topicScale[d.key].bandwidth()-0.5*boxLineShrink;}) // x2 is from the topicScale of this discussion id add the bandwith of the topicScale
            .attr('y2', function(d){return y[className](d[className].boxTop);}) // y2 is from the class y scale of the top to this disccussion
            .attr('stroke', measureColor(className))
            .attr('class', className);
        selectEnter.append('text') // The top number
            .attr('x', function(d){return topicScale[d.key](className);}) // x is from the topicScale of this discussion id
            .attr('y', function(d){return y[className](d[className].boxTop);}) // y is from the class y scale of the top to this disccussion
            .text(function(d){return d[className].boxTop})
            .attr('dy', "0em")
            .attr('text-anchor', "start")
            .attr('class', className);
        // draw the top outliers
        var topOutlier = selectEnter.append('g')
            .attr('class', className)
            .selectAll('.'+className)
            .data(function(d){return d[className].topOutliers;})
            .enter();
        topOutlier.append('circle')
            .attr('cx', function(d){return topicScale[d.topicID](className)+0.5*topicScale[d.topicID].bandwidth();}) // x is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('cy', function(d){return y[className](d[className]);}) // y is from the class y scale of the measureName to this disccussion
            .attr('r', boxOutlierRaius)
            .attr('stroke', measureColor(className))
            .attr('fill', "none")
            .attr('class',className);
        if (showOutlierLabel) {
            topOutlier.append('text')
                .attr('x', function(d){return topicScale[d.topicID](className)+0.5*topicScale[d.topicID].bandwidth();}) // x is from the topicScale of this discussion id add half of the bandwith of the topicScale
                .attr('y', function(d){return y[className](d[className]);}) // y is from the class y scale of the measureName to this disccussion
                .text(function(d){return d[className];})
                .attr('dx', boxOutlierRaius)
                .attr('text-anchor', "start")
                .attr('class', className);
        }
        selectEnter.append('line') // The bottom line
            .attr('x1', function(d){return topicScale[d.key](className)+0.5*boxLineShrink;}) // x1 is from the topicScale of this discussion id
            .attr('y1', function(d){return y[className](d[className].boxBottom);}) // y1 is from the class y scale of the bottom to this disccussion
            .attr('x2', function(d){return topicScale[d.key](className)+topicScale[d.key].bandwidth()-0.5*boxLineShrink;}) // x2 is from the topicScale of this discussion id add the bandwith of the topicScale
            .attr('y2', function(d){return y[className](d[className].boxBottom);}) // y2 is from the class y scale of the bottom to this disccussion
            .attr('stroke', measureColor(className))
            .attr('class', className);
        selectEnter.append('text') // The bottom number
            .attr('x', function(d){return topicScale[d.key](className);}) // x is from the topicScale of this discussion id
            .attr('y', function(d){return y[className](d[className].boxBottom);}) // y is from the class y scale of the bottom to this disccussion
            .text(function(d){return d[className].boxBottom})
            .attr('dy', "0.7em")
            .attr('text-anchor', "start")
            .attr('class', className);
         // draw the bottom outliers
         var bottomOutlier = selectEnter.append('g')
            .attr('class', className)
            .selectAll('.'+className)
            .data(function(d){return d[className].bottomOutliers;})
            .enter();
         bottomOutlier.append('circle')
            .attr('cx', function(d){return topicScale[d.topicID](className)+0.5*topicScale[d.topicID].bandwidth();}) // x is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('cy', function(d){return y[className](d[className]);}) // y is from the class y scale of the measureName to this disccussion
            .attr('r', boxOutlierRaius)
            .attr('stroke', measureColor(className))
            .attr('fill', "none")
            .attr('class',className);
        if (showOutlierLabel) {
            bottomOutlier.append('text')
                .attr('x', function(d){return topicScale[d.topicID](className)+0.5*topicScale[d.topicID].bandwidth();}) // x is from the topicScale of this discussion id add half of the bandwith of the topicScale
                .attr('y', function(d){return y[className](d[className]);}) // y is from the class y scale of the measureName to this disccussion
                .text(function(d){return d[className];})
                .attr('dx', boxOutlierRaius)
                .attr('text-anchor', "start")
                .attr('class', className);
        }
        selectEnter.append('line') // The median line
            .attr('x1', function(d){return topicScale[d.key](className)+0.5*boxLineShrink;}) // x1 is from the topicScale of this discussion id
            .attr('y1', function(d){return y[className](d[className].mid);}) // y1 is from the class y scale of the median to this disccussion
            .attr('x2', function(d){return topicScale[d.key](className)+topicScale[d.key].bandwidth()-0.5*boxLineShrink;}) // x2 is from the topicScale of this discussion id add the bandwith of the topicScale
            .attr('y2', function(d){return y[className](d[className].mid);}) // y2 is from the class y scale of the median to this disccussion
            .attr('stroke', "White")
            .attr('class', className);
        selectEnter.append('text') // The median number
            .attr('x', function(d){return topicScale[d.key](className);}) // x is from the topicScale of this discussion id
            .attr('y', function(d){return y[className](d[className].mid);}) // y is from the class y scale of the median to this disccussion
            .text(function(d){return d[className].mid})
            .attr('dy', "-0.1em")
            .attr('text-anchor', "start")
            .attr('class', className);
        selectEnter.append('line') // The average line
            .attr('x1', function(d){return topicScale[d.key](className)+0.5*boxLineShrink;}) // x1 is from the topicScale of this discussion id
            .attr('y1', function(d){return y[className](d[className].avg);}) // y1 is from the class y scale of the average to this disccussion
            .attr('x2', function(d){return topicScale[d.key](className)+topicScale[d.key].bandwidth()-0.5*boxLineShrink;}) // x2 is from the topicScale of this discussion id add the bandwith of the topicScale
            .attr('y2', function(d){return y[className](d[className].avg);}) // y2 is from the class y scale of the average to this disccussion
            .attr('stroke', "White")
            .attr('stroke-dasharray', "4")
            .attr('class', className);
        selectEnter.append('text') // The average number
            .attr('x', function(d){return topicScale[d.key](className);}) // x is from the topicScale of this discussion id
            .attr('y', function(d){return y[className](d[className].avg);}) // y is from the class y scale of the average to this disccussion
            .text(function(d){return Math.round(d[className].avg*100)/100})
            .attr('dy', "-0.1em")
            .attr('text-anchor', "start")
            .attr('class', className);
    }
    var drawDot = function(d3select, data, className, measureName) { // Draw dot function
        var selectEnter = d3select.selectAll('.'+className).data(data).enter();
        selectEnter.append('circle') // The value circle
            .attr('cx', function(d){return topicScale[d.key](className)+0.5*topicScale[d.key].bandwidth();}) // x is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('cy', function(d){return y[className](d[className][measureName]);}) // y is from the class y scale of the measureName to this disccussion
            .attr('r', circleRadius)
            .attr('fill', measureColor(className))
            .attr('class',className);
        selectEnter.append('text') // The measureName number
            .attr('x', function(d){return topicScale[d.key](className)+0.5*topicScale[d.key].bandwidth();}) // x is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('y', function(d){return y[className](d[className][measureName]);}) // y is from the class y scale of the measureName to this disccussion
            .text(function(d){return Math.round(d[className].avg*100)/100})
            .attr('dy', -circleRadius)
            .attr('text-anchor', "middle")
            .attr('class', className);
        selectEnter.append('line') // The center vertical line
            .attr('x1', function(d){return topicScale[d.key](className)+0.5*topicScale[d.key].bandwidth();}) // x1 is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('y1', function(d){return y[className](d[className][measureName]);}) // y1 is from the class y scale of the measureName to this disccussion
            .attr('x2', function(d){return topicScale[d.key](className)+0.5*topicScale[d.key].bandwidth();}) // x2 is from the topicScale of this discussion id add half of the bandwith of the topicScale
            .attr('y2', y[className](range[className].bottom)) // y2 is from the class y scale of the measurement at the bottom of this className range
            .attr('stroke', measureColor(className))
            .attr('stroke-dasharray', "2")
            .attr('class', className);
    }
    var plot = svg.append('g')
        .attr('id', 'plot');
    // background
    var bg = plot.append('g')
        .attr('id', 'bg');
    bg.selectAll(".bg").data(dataByTopic).enter().append('rect')
        .attr('x', function(d){return x(d.key)-0.5*(x.step()-x.bandwidth());})
        .attr('y', margin_top)
        .attr('width', x.step())
        .attr('height', height)
        .attr('fill', function(d){return background(d.key)})
        .attr('class', "bg");
    // chars_total
    var chars_total_plot = plot.append('g')
        .attr('id', 'chars_total_plot')
        .attr('font-size', "10");
    drawBox(chars_total_plot, dataByTopic, "chars_total");
    // textchars
    var textchars_plot = plot.append('g')
        .attr('id', 'textchars_plot')
        .attr('font-size', "10");
    drawBox(textchars_plot, dataByTopic, "textchars");
    // images
    var images_plot = plot.append('g')
        .attr('id', 'images_plot')
        .attr('font-size', "10");
    drawDot(images_plot, dataByTopic, "images", "avg");
    // resp
    var resp_plot = plot.append('g')
        .attr('id', 'resp_plot')
        .attr('font-size', "10");
    drawDot(images_plot, dataByTopic, "resp", "avg");
    
    // Draw lables
    var labels =svg.append('g')
        .attr('id', "lables")
        .attr('transform', "translate(0, "+(margin_top+margin_bottom+height)+")")
        .selectAll('.lables')
        .data(measurement)
        .enter();
    labels.append('rect')
        .attr('x', function(d){return labelsScale(d);})
        .attr('y', "0")
        .attr('width', labelRectSize)
        .attr('height', labelRectSize)
        .attr('fill', function(d){return measureColor(d)})
        .attr('class','lables');
    labels.append('text')
        .attr('x', function(d){return labelsScale(d);})
        .attr('y', "0")
        .attr('dx', 1.1*labelRectSize)
        .attr('dy', 0.7*labelRectSize)
        .attr('text-anchor', 'start')
        .text(function(d){return measureName[d];})
        .attr('class','lables');

}