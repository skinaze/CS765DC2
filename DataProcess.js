// Generate box varaibales
// First, sort the data. Second, computer statistics. Third, calculate the outliers
// @arg		data		array/object	The data to process
// @arg		orderFunc	function		The function to sort data
// @arg		accessor	function 		The function to access the part of data interested in
var genBoxVar = function (data, orderFunc = d3.ascending, accessor = null) {
	// Get the data
	var valueTemp = new Array;
	data.forEach( d => {
		if (accessor != null) valueTemp.push(Number(accessor(d)));
		else valueTemp.push(Number(d));
	});
	// Sort the data
	valueTemp.sort(orderFunc);
	// statistics
	var boxVarTemp = new Object;
	boxVarTemp.avg = d3.mean(valueTemp);
	boxVarTemp.mid = d3.median(valueTemp);
	boxVarTemp.t25 = d3.quantile(valueTemp, 0.75);  // Top quarter 
	boxVarTemp.b25 = d3.quantile(valueTemp, 0.25); // Bottom quarter
	boxVarTemp.top = valueTemp[valueTemp.length - 1]; // The real top
	boxVarTemp.bottom = valueTemp[0]; // The real bottom
	// Outliers
	var bound = 1.5*Math.abs(boxVarTemp.t25 - boxVarTemp.b25)
	// Top Outliers
	if (Math.abs(boxVarTemp.top - boxVarTemp.t25) <= bound) {
		boxVarTemp.boxTop = boxVarTemp.top;
		boxVarTemp.topOutliers = [];
	} else {
		var dataByOutlier = d3.nest().key(function(d){
			if (orderFunc(d, boxVarTemp.t25) > 0) return (Math.abs(d-boxVarTemp.t25) < bound);
			else return true;
		}).entries(valueTemp);
		var dataInBound = dataByOutlier.find(function(d){return (d.key == "true")}).values;
		var dataOutBound = dataByOutlier.find(function(d){return (d.key == "false")}).values;
		boxVarTemp.boxTop = boxVarTemp.bottom;
		dataInBound.forEach(d => {
			boxVarTemp.boxTop = (orderFunc(d, boxVarTemp.boxTop) > 0)?d:boxVarTemp.boxTop;
		}); 
		boxVarTemp.topOutliers = dataOutBound;
	}
	// Bottom Outliers
	if (Math.abs(boxVarTemp.b25 - boxVarTemp.bottom) <= bound) {
		boxVarTemp.boxBottom = boxVarTemp.bottom;
		boxVarTemp.bottomOutliers = [];
	} else {
		var dataByOutlier = d3.nest().key(function(d){
			if (orderFunc(boxVarTemp.b25, d) > 0) return (Math.abs(boxVarTemp.b25 - d) < bound);
			else return true;
		}).entries(valueTemp);
		var dataInBound = dataByOutlier.find(function(d){return (d.key == "true")}).values;
		var dataOutBound = dataByOutlier.find(function(d){return (d.key == "false")}).values;
		boxVarTemp.boxBottom = boxVarTemp.top;
		dataInBound.forEach(d => {
			boxVarTemp.boxBottom = (orderFunc(boxVarTemp.boxBottom, d) > 0)?d:boxVarTemp.boxBottom;
		});
		boxVarTemp.bottomOutliers = dataOutBound;
	}

	return boxVarTemp;
	
}