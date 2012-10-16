var ChordCanvas = Canvas.extend({
    type: "Chord",
    
    statement: function(){
    	var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.date AS start_date, ends.date AS end_date, starts.location_name AS start_name, ends.location_name AS end_name, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ) SELECT tracks.start_name, tracks.end_name, tracks.start_id, tracks.end_id, COUNT(*) AS cnt FROM tracks WHERE ";
    	
    	sql += this.filter.userFiltering(this.userId);
    	sql += this.filter.minDateFiltering();
		sql += this.filter.maxDateFiltering();
		sql += this.filter.minTimeFiltering();
		sql += this.filter.maxTimeFiltering();
		sql += this.filter.minDistanceFiltering();
		sql += this.filter.maxDistanceFiltering();
		sql += this.filter.minDurationFiltering();
		sql += this.filter.maxDurationFiltering();
		sql += this.filter.minCarbonFiltering();
		sql += this.filter.maxCarbonFiltering();
		sql += this.filter.startLocationFiltering();
		sql += this.filter.endLocationFiltering();
		sql += this.filter.transportModeFiltering();
    	
    	sql += " GROUP BY tracks.start_name, tracks.end_name, tracks.start_id, tracks.end_id HAVING COUNT(*) > 0 ORDER BY start_name DESC";
    	
		/* console.log(sql); */
		return encodeUrl(sql);
    },
    
    initialize: function() {	
    	_.bindAll(this, 'generateGraph', 'render', 'resize', 'loadData', 'loadedData', 'settings', 'containsKey', 'getKey');
    	this.$el.addClass('chord');
	},
	
	render: function(){
		console.log("ChordDiagram: Rendering");
		this.loadData();
	},
	
	generateGraph: function(data){
		var chord = d3.layout.chord()
		    .padding(.05)
		    .sortSubgroups(d3.descending)
		    .matrix(data);
		
		var width = this.$el.width(),
		    height = this.$el.height(),
		    outerRadius = Math.min(width, height) * .35,
		    innerRadius = outerRadius*0.90
		
		var fill = d3.scale.category20b();
		
		var chart = d3.select(this.$el.selector)
		  .append("svg")
		    .attr("width", width)
		    .attr("height", height)
		  .append("g")
		    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");
		
		var getLabel = _.bind(function(index){
			return this.keys[index].name;
		}, this);
		
		var mouseover = _.bind(function(){
			return _.bind(function(d, i) {
				this.configuration.highlightTrack(null, this.keys[d.index].id, this.keys[d.index].id);
		    	chart.selectAll("g.chord path")
			        .filter(function(d) {
			          return d.source.index != i && d.target.index != i;
			        })
			        .transition()
			        .style("opacity", .1);
			}, this);		
		}, this);
		
		var mouseout = _.bind(function(){
			return _.bind(function(d, i) {
				this.configuration.clearHighlightTrack();
		    	chart.selectAll("g.chord path")
			        .transition()
			        .style("opacity", 1);
			}, this);		
		}, this);
		
		chart.append("g")
		  .selectAll("path")
		    .data(chord.groups)
		  .enter().append("path")
		    .style("fill", function(d) { return fill(d.index) })
		    .style("stroke", function(d) { return fill(d.index) })
		    .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
			    .on("mouseover", mouseover())
			    .on("mouseout", mouseout());
		
		var labels = chart.append("g")
			.selectAll("g")
				.data(chord.groups)
			.enter().append("text")
			.each(function(d) { d.angle = d.startAngle + (d.endAngle - d.startAngle) / 2; })
			.text(function(d) { return getLabel(d.index) })
			.attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
			.attr("transform", function(d) {
				return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
			      + "translate(" + (outerRadius+5) + ",0)"
			      + (d.angle > Math.PI ? "rotate(180)" : "");
			});
			
		chart.append("g")
		    .attr("class", "chord")
		  .selectAll("path")
		    .data(chord.chords)
		  .enter().append("path")
		    .style("fill", function(d) { return d3.hsl(fill(d.target.index)).brighter(0.3); })
		    .style("stroke", function(d) { return fill(d.target.index); })
		    .attr("d", d3.svg.chord().radius(innerRadius))
		    .style("opacity", 1);
		    
		return chart;    
	},
	
	loadData: function(){
		this.$el.html('');
		$.get(this.statement(), this.loadedData);	
	},
	
	loadedData: function(data){
		console.log("LoadedChordDiagramData in " + data.time);
		console.log(data);
		
		this.keys = [];
		
		var key = 0;
		_.each(data.rows, function(row){
			if(!this.containsKey(row.start_id)) this.keys.push({name: row.start_name, id: row.start_id, key: key++});
			if(!this.containsKey(row.end_id)) this.keys.push({name: row.end_name, id: row.end_id, key: key++});
		}, this);
		
		this.values = [];
		for(var i = 0; i < this.keys.length; i++){ 
			this.values[i] = [];
			for(var j = 0; j < this.keys.length; j++){
				this.values[i][j] = 0;
			}
		}

		_.each(data.rows, function(row){
			var i = this.getKey(row.start_id).key;
			var j = this.getKey(row.end_id).key;
			this.values[j][i] = row.cnt;
		}, this);

		this.chart = this.generateGraph(this.values);	
	},
	
	getKey: function(id){
		for(var i = 0; i < this.keys.length; i++) if(this.keys[i].id == id) return this.keys[i];
	},
	
	containsKey: function(id){
		return this.getKey(id) != null;
	},
	
	resize: function(){
		if(this.chart != null){
			this.$el.html('');
			this.chart = this.generateGraph(this.values);
		}
	},
	
	clear: function(){
		this.unbind();
		this.filter.off("change", this.render);
		
		var id = this.$el.attr('id');
		var newNode = $('<div id="' + id + '" class="cell">');
		
		this.$el.before(newNode);
		this.$el.remove();
		this.$el = newNode;
	},
	
	highlightTrack: function(id){
		
	},
	
	clearHighlightTrack: function(){
		
	},
	
	settings: function(){
		return {
			id: this.id,
		}
	}
});

ChordCanvas.prototype.id = "chord";
ChordCanvas.prototype.label = "Location Relationships";
ChordCanvas.prototype.thumb = "thumb_locations.png"