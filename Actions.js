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