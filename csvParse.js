var defaultCsvName = "2017-5-5.csv";
var csvData = new Array;
var dataByTopic;
var sigma;

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
			createViolinChart(dataByTopic, sigma, true);
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
			createViolinChart(dataByTopic, sigma, true);
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
	var dataByPersonOfRoot = d3.nest()
		.key(function(d){return d.user})
		.entries(dataRoot.values);
	var personalAvgOfRoot = new Object;
	dataByPersonOfRoot.forEach(person => {
		temp = new Object;
		temp.chars_total = d3.mean(person.values,
			function(d){return d.chars_total;});
		temp.textchars = d3.mean(person.values,
			function(d){return d.textchars;});
		temp.images = d3.mean(person.values,
			function(d){return d.images;});
		temp.resp = d3.mean(person.values,
			function(d){return d.totalChildren});
		personalAvgOfRoot[person.key] = temp;
	});
	var dataByPersonOfChildren = d3.nest()
		.key(function(d){return d.user})
		.entries(dataChildren.values);
	var personalAvgOfChildren = new Object;
	dataByPersonOfChildren.forEach(person => {
		temp = new Object;
		temp.chars_total_resp = d3.mean(person.values,
			function(d){return d.chars_total;});
		temp.textchars_resp = d3.mean(person.values,
			function(d){return d.textchars;});
		temp.images_resp = d3.mean(person.values,
			function(d){return d.images;});
		temp.resp_person = d3.mean(
			d3.nest().key(function(d){return d.topicID;}).entries(person.values),
			function(d){return d.values.length;});
		personalAvgOfChildren[person.key] = temp;
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

		// chars_total_resp part
		element.chars_total_resp = genBoxVar(elementChildren.values, d3.ascending, function(d){return d.chars_total;});

		// textchars part
		element.textchars = genBoxVar(elementRoot.values, d3.ascending, function(d){return d.textchars;});

		// textchars_resp part
		element.textchars_resp = genBoxVar(elementChildren.values, d3.ascending, function(d){return d.textchars;});

		// images part
		// 1) images statistic
		element.images = genBoxVar(elementRoot.values, d3.ascending, function(d){return d.images;});
		// 2) images ratio
		element.images.withImage = d3.sum(elementRoot.values,
			function(d){return (Math.floor(d.images) > 0)?1:0;});
		element.images.ratio = element.images.withImage/elementRoot.values.length;

		// images_resp part
		// 1) images_resp statistic
		element.images_resp = genBoxVar(elementChildren.values, d3.ascending, function(d){return d.images;});
		// 2) images ratio
		element.images_resp.withImage = d3.sum(elementChildren.values,
			function(d){return (Math.floor(d.images) > 0)?1:0;});
		element.images_resp.ratio = element.images_resp.withImage/elementChildren.values.length;

		// Response part
		// 1) Response statistic
		element.resp = genBoxVar(elementRoot.values, d3.ascending, function(d){return d.totalChildren;});
		// 2) Response ratio
		element.resp.resp_num = elementChildren.values.length;
		element.resp.root_num = elementRoot.values.length;
		element.resp.ratio = element.resp.resp_num/element.resp.root_num; // Average response per post

		// Response per person posts part
		var respByPerson = d3.nest().key(function(d){return d.user}).entries(elementChildren.values);
		var respPerPerson = new Array;
		respByPerson.forEach(p => {respPerPerson.push(p.values.length)});
		element.resp_person = genBoxVar(respPerPerson);

		// Part2: distribution (change in behavior)
		element.chars_total.change = new Array;
		element.chars_total_resp.change = new Array;
		element.textchars.change = new Array;
		element.textchars_resp.change = new Array;
		element.images.change = new Array;
		element.images_resp.change = new Array;
		element.resp.change = new Array;
		element.resp_person.change = new Array;
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
			element.chars_total.change.push(person.chars_total - personalAvgOfRoot[person.key].chars_total);
			element.textchars.change.push(person.textchars - personalAvgOfRoot[person.key].textchars);
			element.images.change.push(person.images - personalAvgOfRoot[person.key].images);
			element.resp.change.push(person.resp - personalAvgOfRoot[person.key].resp);
		});
		var elementChildrenByPerson = d3.nest()
			.key(function(d){return d.user})
			.entries(elementChildren.values);
		elementChildrenByPerson.forEach(person =>{
			person.chars_total_resp = d3.mean(person.values,
				function(d){return d.chars_total});
			person.textchars_resp = d3.mean(person.values,
				function(d){return d.textchars});
			person.images_resp = d3.mean(person.values,
				function(d){return d.images});
			person.resp_person = person.values.length;
			element.chars_total_resp.change.push(person.chars_total_resp - personalAvgOfChildren[person.key].chars_total_resp);
			element.textchars_resp.change.push(person.textchars_resp - personalAvgOfChildren[person.key].textchars_resp);
			element.images_resp.change.push(person.images_resp - personalAvgOfChildren[person.key].images_resp);
			element.resp_person.change.push(person.resp_person - personalAvgOfChildren[person.key].resp_person);
		});
	});

	// Calculate the standard diviation
	var change = new Object;
	change.chars_total = new Array;
	change.chars_total_resp = new Array;
	change.textchars = new Array;
	change.textchars_resp = new Array;
	change.images = new Array;
	change.images_resp = new Array;
	change.resp = new Array;
	change.resp_person = new Array;
	dataByTopic.forEach(element => {
		change.chars_total = change.chars_total.concat(element.chars_total.change);
		change.chars_total_resp = change.chars_total_resp.concat(element.chars_total_resp.change);
		change.textchars = change.textchars.concat(element.textchars.change);
		change.textchars_resp = change.textchars_resp.concat(element.textchars_resp.change);
		change.images = change.images.concat(element.images.change);
		change.images_resp = change.images_resp.concat(element.images_resp.change);
		change.resp = change.resp.concat(element.resp.change);
		change.resp_person = change.resp_person.concat(element.resp_person.change);
	});
	sigma = new Object;
	sigma.chars_total = d3.deviation(change.chars_total);
	sigma.chars_total_resp = d3.deviation(change.chars_total_resp);
	sigma.textchars = d3.deviation(change.textchars);
	sigma.textchars_resp = d3.deviation(change.textchars_resp);
	sigma.images = d3.deviation(change.images);
	sigma.images_resp = d3.deviation(change.images_resp);
	sigma.resp = d3.deviation(change.resp);
	sigma.resp_person = d3.deviation(change.resp_person);

}

