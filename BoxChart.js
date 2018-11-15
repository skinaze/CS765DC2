// Create the box chart
var createBoxChart = function (dataByTopic) {
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
		numberFontSize = 9,
		labelRectSize = 20,
		labelFontSize = 12,
		measurement = [
			"chars_total", 
			"chars_total_resp", 
			//"textchars", 
			//"textchars_resp", 
			"images", 
			//"images_resp",
			"resp",
			"resp_person"
		],
		measureType = {
			chars_total: "box", 
			chars_total_resp: "box", 
			textchars: "box", 
			textchars_resp: "box", 
			images: "dot", 
			images_resp: "dot",
			resp: "dot",
			resp_person: "dot"
		},
		measureName = {
			chars_total: "Post total characters", 
			chars_total_resp:"Response total characters", 
			textchars: "Post total text characters", 
			textchars_resp: "Response total text characters",
			images: "Image number per post", 
			images_resp: "Image number per response",
			resp: "Response per post",
			resp_person: "Response posted per person"
		};

	// Create scales
	var x = d3.scaleBand()
		.domain(dataByTopic.topicList)
		.rangeRound([margin_left,width+margin_left])
		.padding([paddingTopic]); // The overall x-scale
	var topicScale = new Object; // Horizontal scale for each topic
	var range = new Object; // The vertical range
	measurement.forEach(ms => {
		range[ms] = new Object;
		range[ms].bottom = 0;
	});
	dataByTopic.forEach(element => {
		// Set the horizontal scale
		topicScale[element.key] = d3.scaleBand()
			.domain(measurement)
			.rangeRound([x(element.key), x(element.key)+x.bandwidth()])
			.padding([paddingMeasure]);
		// Set top and bottom for each measurement
		measurement.forEach(ms => {
			if (measureType[ms] == "box") {
				if (typeof range[ms].top == 'undefined') range[ms].top = element[ms].top;
				else if (range[ms].top < element[ms].top) range[ms].top = element[ms].top;
			} else if (measureType[ms] == "dot") {
				if (typeof range[ms].top == 'undefined') range[ms].top = element[ms].avg;
				else if (range[ms].top < element[ms].top) range[ms].top = element[ms].avg;
			} else {console.log("Undefined measureType: "+ms);}
		});
	});
	var y = new Object; // Different y scale for different measurement
	measurement.forEach(ms => {
		range[ms].top = Math.ceil(range[ms].top*1.1); // Scale up maxinum to 1.1 times
		y[ms] = d3.scaleLinear()
		.domain([range[ms].bottom, range[ms].top])
		.range([height+margin_top, margin_top]); // measurement scale
	});
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
	var drawBox = function(d3select, dataByTopic, className) { // Draw box function
		var selectEnter = d3select.selectAll('.'+className).data(dataByTopic).enter();
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
			.data(function(d){
				var temp = new Array;
				d[className].topOutliers.forEach(o => {
					var outlier = new Object;
					outlier.topicID = d.key;
					outlier[className] = o;
					temp.push(outlier);
				});
				return temp;
			})
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
			.data(function(d){
				var temp = new Array;
				d[className].bottomOutliers.forEach(o => {
					var outlier = new Object;
					outlier.topicID = d.key;
					outlier[className] = o;
					temp.push(outlier);
				});
				return temp;
			})
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
	var drawDot = function(d3select, dataByTopic, className, measureName) { // Draw dot function
		var selectEnter = d3select.selectAll('.'+className).data(dataByTopic).enter();
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
	// Draw data for measurements
	measurement.forEach(ms => {
		var msplot = plot.append('g')
			.attr('id', ms+'_plot')
			.attr('font-size', numberFontSize);
		if (measureType[ms] == "box") drawBox(msplot, dataByTopic, ms);
		else if (measureType[ms] == "dot") drawDot(msplot, dataByTopic, ms, "avg");
		else console.log("Undefined measureType: "+ms);
	})

	// Draw lables
	var labels =svg.append('g')
		.attr('id', "lables")
		.attr('transform', "translate(0, "+(margin_top+margin_bottom+height)+")")
		.attr('font-size', labelFontSize)
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
