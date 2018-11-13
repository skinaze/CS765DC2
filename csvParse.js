var defaultCsvName = "2017-5-5.csv";
var csvData = new Array;
var dataByTopic;

function defaultCsv() {
	Papa.parse(defaultCsvName, {
		download: true,
		complete: function(results) {
			console.log(results);
			csvData = results.data;
			dataParse();
			createBoxChart(dataByTopic);
			genDisSelect();
			createViolinChart(dataByTopic, true);
		},
		header: true,
		skipEmptyLines: true
	});
}

function csvParse() {
	d3.select('#defaultNotice').attr('hidden', "hidden");
	var selectedFile = document.getElementById('csvFile').files[0];
	Papa.parse(selectedFile, {
		complete: function(results) {
			console.log(results);
			csvData = results.data;
			dataParse();
			createBoxChart(dataByTopic);
			genDisSelect();
			createViolinChart(dataByTopic, true);
		},
		header: true,
		skipEmptyLines: true
	});
}

function dataParse() {
	// Calculate the totalChildren
	csvData.forEach(resp => { // Calculate the total response of a intital post
		if ((resp.parent == "")&&(typeof resp.totalChildren == 'undefined')) resp.totalChildren = 0;
		var respTemp = resp;
		while (respTemp.parent != "") {
			var parentTemp = respTemp.parent;
			respTemp = csvData.find(function(d){return (d.id == respTemp.parent)});
			if (typeof respTemp == 'undefined') {
				console.log('Parent not found: ', parentTemp);
				break;
			}
		}
		if (typeof respTemp.totalChildren == 'undefined') respTemp.totalChildren = Math.floor(resp.numChildren);
		else respTemp.totalChildren = respTemp.totalChildren + Math.floor(resp.numChildren);
	});
	// Divide into intital posts and responses
	var dataByRootChildren = d3.nest()
		.key(function(d) {return (d.parent == "")?"root":"children"})
		.entries(csvData);
	var dataRoot = dataByRootChildren
		.find(function(d){return (d.key == "root")}); // Initial posts
	var dataChildren = dataByRootChildren
		.find(function(d){return (d.key == "children")}); // Response
	
	// Personal average behavior
	var dataByPerson = d3.nest()
		.key(function(d){return d.user})
		.entries(dataRoot.values);
	var personalAvg = new Object;
	dataByPerson.forEach(person => {
		temp = new Object;
		temp.chars_total = d3.mean(person.values,
			function(d){return d.chars_total;});
		temp.textchars = d3.mean(person.values,
			function(d){return d.textchars;});
		temp.images = d3.mean(person.values,
			function(d){return d.images;});
		temp.resp = d3.mean(person.values,
			function(d){return d.totalChildren});
		personalAvg[person.key] = temp;
	});

	// Group data by topic
	dataByTopic = d3.nest()
		.key(function(d){return d.topicID})
		.entries(csvData);
	dataByTopic.topicList = new Array;

	// Process each topic
	dataByTopic.forEach(element => {
		// Pre-processing
		dataByTopic.topicList.push(element.key);

		// Divide posts into intial posts and response
		element.values.forEach(resp => { // Calculate the total response of a intital post
			if ((resp.parent == "")&&(typeof resp.totalChildren == 'undefined')) resp.totalChildren = 0;
			var respTemp = resp;
			while (respTemp.parent != "") {
				var parentTemp = respTemp.parent;
				respTemp = element.values.find(function(d){return (d.id == respTemp.parent)});
				if (typeof respTemp == 'undefined') {
					console.log('Parent not found: ', parentTemp);
					break;
				}
			}
			if (typeof respTemp.totalChildren == 'undefined') respTemp.totalChildren = Math.floor(resp.numChildren);
			else respTemp.totalChildren = respTemp.totalChildren + Math.floor(resp.numChildren);
		});
		var elementByRootChildren = d3.nest()
			.key(function(d) {return (d.parent == "")?"root":"children"})
			.entries(element.values);
		var elementRoot = elementByRootChildren
			.find(function(d){return (d.key == "root")}); // Initial posts
		var elementChildren = elementByRootChildren
			.find(function(d){return (d.key == "children")}); // Response
		
		// Part1: statistic
		// chars_total part
		elementRoot.values.sort(function(a,b){ // Ascending order
			var aInt = Math.floor(a.chars_total);
			var bInt = Math.floor(b.chars_total);
			if (aInt > bInt) return 1;
			else if (aInt < bInt) return -1;
			else return 0;
		});
		element.chars_total = new Object;
		element.chars_total.avg = d3.mean(elementRoot.values, 
			function(d){return d.chars_total});
		element.chars_total.mid = d3.median(elementRoot.values, 
			function(d){return d.chars_total});
		element.chars_total.t25 = d3.quantile(elementRoot.values, 0.75, 
			function(d){return d.chars_total}); // The higher char_total the better
		element.chars_total.b25 = d3.quantile(elementRoot.values, 0.25, 
			function(d){return d.chars_total}); // The lower char_total the worse
		element.chars_total.top = Math.floor(elementRoot.values[elementRoot.values.length - 1].chars_total);
		element.chars_total.bottom = Math.floor(elementRoot.values[0].chars_total);
		if ((element.chars_total.top-element.chars_total.t25) <= 1.5*(element.chars_total.t25 - element.chars_total.b25)) {
			element.chars_total.boxTop = element.chars_total.top;
			element.chars_total.topOutliers = [];
		} else { // The top outliers
			var temp = d3.nest()
				.key(function(d){
					return ((d.chars_total-element.chars_total.t25) > 1.5*(element.chars_total.t25 - element.chars_total.b25));
				})
				.entries(elementRoot.values);
			element.chars_total.boxTop = d3.max(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.chars_total);}); // Reset the real bound
			element.chars_total.topOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}
		if ((element.chars_total.b25-element.chars_total.bottom) <= 1.5*(element.chars_total.t25 - element.chars_total.b25)) {
			element.chars_total.boxBottom = element.chars_total.bottom;
			element.chars_total.bottomOutliers = [];
		} else { // The bottom outliers
			var temp = d3.nest()
				.key(function(d){
					return ((element.chars_total.b25-d.chars_total) > 1.5*(element.chars_total.t25 - element.chars_total.b25));
				})
				.entries(elementRoot.values);
			element.chars_total.boxBottom = d3.min(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.chars_total);}); // Reset the real bound
			element.chars_total.bottomOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}

		// textchars part
		elementRoot.values.sort(function(a,b){ // Ascending order
			var aInt = Math.floor(a.textchars);
			var bInt = Math.floor(b.textchars);
			if (aInt > bInt) return 1;
			else if (aInt < bInt) return -1;
			else return 0;
		});
		element.textchars = new Object;
		element.textchars.avg = d3.mean(elementRoot.values, 
			function(d){return d.textchars});
		element.textchars.mid = d3.median(elementRoot.values, 
			function(d){return d.textchars});
		element.textchars.t25 = d3.quantile(elementRoot.values, 0.75, 
			function(d){return d.textchars}); // The higher testchars the better
		element.textchars.b25 = d3.quantile(elementRoot.values, 0.25, 
			function(d){return d.textchars}); // The lower testchars the worse
		element.textchars.top = Math.floor(elementRoot.values[elementRoot.values.length - 1].textchars);
		element.textchars.bottom = Math.floor(elementRoot.values[0].textchars);
		if ((element.textchars.top-element.textchars.t25) <= 1.5*(element.textchars.t25 - element.textchars.b25)) {
			element.textchars.boxTop = element.textchars.top;
			element.textchars.topOutliers = [];
		} else { // The top outliers
			var temp = d3.nest()
				.key(function(d){
					return ((d.textchars-element.textchars.t25) > 1.5*(element.textchars.t25 - element.textchars.b25));
				})
				.entries(elementRoot.values);
			element.textchars.boxTop = d3.max(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.textchars);}); // Reset the real bound
			element.textchars.topOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}
		if ((element.textchars.b25-element.textchars.bottom) <= 1.5*(element.textchars.t25 - element.textchars.b25)) {
			element.textchars.boxBottom = element.textchars.bottom;
			element.textchars.bottomOutliers = [];
		} else { // The bottom outliers
			var temp = d3.nest()
				.key(function(d){
					return ((element.textchars.b25-d.textchars) > 1.5*(element.textchars.t25 - element.textchars.b25));
				})
				.entries(elementRoot.values);
			element.textchars.boxBottom = d3.min(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.textchars);}); // Reset the real bound
			element.textchars.bottomOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}

		// images part
		// 1) images ratio
		element.images = new Object;
		element.images.withImage = d3.sum(elementRoot.values,
			function(d){return (Math.floor(d.images) > 0)?1:0;});
		element.images.ratio = element.images.withImage/elementRoot.values.length;
		// 2) images statistic
		elementRoot.values.sort(function(a,b){ // Ascending order
			var aInt = Math.floor(a.images);
			var bInt = Math.floor(b.images);
			if (aInt > bInt) return 1;
			else if (aInt < bInt) return -1;
			else return 0;
		});
		element.images.avg = d3.mean(elementRoot.values, 
			function(d){return d.images});
		element.images.mid = d3.median(elementRoot.values, 
			function(d){return d.images});
		element.images.t25 = d3.quantile(elementRoot.values, 0.75, 
			function(d){return d.images}); // The higher images the better
		element.images.b25 = d3.quantile(elementRoot.values, 0.25, 
			function(d){return d.images}); // The lower images the worse
		element.images.top = Math.floor(elementRoot.values[elementRoot.values.length - 1].images);
		element.images.bottom = Math.floor(elementRoot.values[0].images);
		if ((element.images.top-element.images.t25) <= 1.5*(element.images.t25 - element.images.b25)) {
			element.images.boxTop = element.images.top;
			element.images.topOutliers = [];
		} else { // The top outliers
			var temp = d3.nest()
				.key(function(d){
					return ((d.images-element.images.t25) > 1.5*(element.images.t25 - element.images.b25));
				})
				.entries(elementRoot.values);
			element.images.boxTop = d3.max(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.images);}); // Reset the real bound
			element.images.topOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}
		if ((element.images.b25-element.images.bottom) <= 1.5*(element.images.t25 - element.images.b25)) {
			element.images.boxBottom = element.images.bottom;
			element.images.bottomOutliers = [];
		} else { // The bottom outliers
			var temp = d3.nest()
				.key(function(d){
					return ((element.images.b25-d.images) > 1.5*(element.images.t25 - element.images.b25));
				})
				.entries(elementRoot.values);
			element.images.boxBottom = d3.min(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.images);}); // Reset the real bound
			element.images.bottomOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}

		// Response part
		// 1) Response ratio
		element.resp = new Object;
		element.resp.resp_num = elementChildren.values.length;
		element.resp.root_num = elementRoot.values.length;
		element.resp.ratio = element.resp.resp_num/element.resp.root_num; // Average response per post
		// 2) Response statistic
		elementRoot.values.sort(function(a,b){ // Ascending order
			var aInt = Math.floor(a.totalChildren);
			var bInt = Math.floor(b.totalChildren);
			if (aInt > bInt) return 1;
			else if (aInt < bInt) return -1;
			else return 0;
		});
		element.resp.avg = d3.mean(elementRoot.values, 
			function(d){return d.totalChildren});
		element.resp.mid = d3.median(elementRoot.values, 
			function(d){return d.totalChildren});
		element.resp.t25 = d3.quantile(elementRoot.values, 0.75, 
			function(d){return d.totalChildren}); // The higher resp the better
		element.resp.b25 = d3.quantile(elementRoot.values, 0.25, 
			function(d){return d.totalChildren}); // The lower resp the worse
		element.resp.top = Math.floor(elementRoot.values[elementRoot.values.length - 1].totalChildren);
		element.resp.bottom = Math.floor(elementRoot.values[0].totalChildren);
		if ((element.resp.top-element.resp.t25) <= 1.5*(element.resp.t25 - element.resp.b25)) {
			element.resp.boxTop = element.resp.top;
			element.resp.topOutliers = [];
		} else { // The top outliers
			var temp = d3.nest()
				.key(function(d){
					return ((d.totalChildren-element.resp.t25) > 1.5*(element.resp.t25 - element.resp.b25));
				})
				.entries(elementRoot.values);
			element.resp.boxTop = d3.max(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.totalChildren);}); // Reset the real bound
			element.resp.topOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}
		if ((element.resp.b25-element.resp.bottom) <= 1.5*(element.resp.t25 - element.resp.b25)) {
			element.resp.boxBottom = element.resp.bottom;
			element.resp.bottomOutliers = [];
		} else { // The bottom outliers
			var temp = d3.nest()
				.key(function(d){
					return ((element.resp.b25-d.totalChildren) > 1.5*(element.resp.t25 - element.resp.b25));
				})
				.entries(elementRoot.values);
			element.resp.boxBottom = d3.min(
				temp.find(function(d){return (d.key == "false")}).values,
				function(d){return Math.floor(d.totalChildren);}); // Reset the real bound
			element.resp.bottomOutliers = temp.find(function(d){return (d.key == "true")}).values;
		}
		
		// Part2: distribution (change in behavior)
		element.chars_total.change = new Array;
		element.textchars.change = new Array;
		element.images.change = new Array;
		element.resp.change = new Array;
		var elementRootByPerson = d3.nest()
			.key(function(d){return d.user})
			.entries(elementRoot.values);
		elementRootByPerson.forEach(person =>{
			person.chars_total = d3.mean(person.values,
				function(d){return d.chars_total});
			person.textchars = d3.mean(person.values,
				function(d){return d.textchars});
			person.images = d3.mean(person.values,
				function(d){return d.images});
			person.resp = d3.mean(person.values,
				function(d){return d.totalChildren});
			element.chars_total.change.push(person.chars_total - personalAvg[person.key].chars_total);
			element.textchars.change.push(person.textchars - personalAvg[person.key].textchars);
			element.images.change.push(person.images - personalAvg[person.key].images);
			element.resp.change.push(person.resp - personalAvg[person.key].resp);
		});
	});
	
}

function genDisSelect(){
	var disSelect = d3.select('#disSelect');
	disSelect.html([null]);
	var selected = false;
	dataByTopic.forEach(element => {
		var temp = disSelect.append('option')
			.attr("value", element.key)
			.text(element.key);
		if (!selected) {
			temp.attr("selected", "selected");
			selected = true;
		}
	});
}