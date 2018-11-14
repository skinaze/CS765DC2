var defaultCsvName = "2017-5-5.csv";
var csvData = new Array;
var dataByTopic;

// Load the default csv
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

// Load the selected csv
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
		element.chars_total = genBoxVar(elementRoot.values, d3.ascending, function(d){return d.chars_total;});

		// textchars part
		element.textchars = genBoxVar(elementRoot.values, d3.ascending, function(d){return d.textchars;});

		// images part
		// 1) images statistic
		element.images = genBoxVar(elementRoot.values, d3.ascending, function(d){return d.images;});
		// 2) images ratio
		element.images.withImage = d3.sum(elementRoot.values,
			function(d){return (Math.floor(d.images) > 0)?1:0;});
		element.images.ratio = element.images.withImage/elementRoot.values.length;

		// Response part
		// 1) Response statistic
		element.resp = genBoxVar(elementRoot.values, d3.ascending, function(d){return d.totalChildren;});
		// 2) Response ratio
		element.resp.resp_num = elementChildren.values.length;
		element.resp.root_num = elementRoot.values.length;
		element.resp.ratio = element.resp.resp_num/element.resp.root_num; // Average response per post

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

