var PlotCanvas = Canvas.extend({
    defaults: function(){
		return {
			settings: {
				id: "plot",
				type: "scatter",
				x: "start_date",
				y: "distance",
				size: "distance",
				color: "carbon"
			}
		}    
    },
    
    statement: function(){
    	var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, MIN(timestamp) AS start, MAX(timestamp) AS end, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, (extract(hour from MIN(segments.start) + SUM(segments.time)/2) + extract(minute from MIN(segments.start) + SUM(segments.time)/2)/60) AS hour, starts.location_id AS start_id, ends.location_id AS end_id, starts.date AS start_date, ends.date AS end_date, starts.location_name AS start_name, ends.location_name AS end_name, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name )";
    	
    	sql += " SELECT tracks.id, tracks.start_id, tracks.end_id, " + this.settings.y + " AS y, " + this.settings.x + " AS x, " + this.settings.color + " AS color, " + this.settings.size + " AS size FROM tracks WHERE ";
    	
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
    	
		sql += " ORDER BY x"
		console.log(sql);
		return encodeUrl(sql);
    },
    
    initialize: function() {
    	_.bindAll(this, 'generateScatterGraph', 'generateLineGraph', 'render', 'resize', 'loadData', 'loadedData', 'getXAxisFormat', 'getYAxisFormat', 'getXDomain', 'getYDomain', 'getSizeDomain', 'getXScale', 'getYScale', 'getXAxisFormat', 'getYAxisFormat', 'formatX', 'formatY', 'formatSize', 'formatColor', 'getColorScale', 'getSizeScale', 'getColorRange');
	    
		this.$el.addClass('chartWrap');
		this.$el.html('<svg class="nvd3"></svg>');
		
		this.settings = this.defaults().settings;
	},
	
	loadData: function(){
		$.get(this.statement(), this.loadedData);	
	},
	
	loadedData: function(raw){
		console.log("Loaded " + this.settings.type + " Data in " + raw.time);
		console.log(raw);
		this.preProcessData(raw);
		
		var data = [];
		var dataRow = {key: 'Dataset1', values: []};		
		data.push(dataRow);
 	 	
		switch(this.settings.type){
			case "scatter":
				_.each(raw.rows, function(row){
					dataRow.values.push({
						id: row.id,
						start: row.start_id,
						end: row.end_id,
						x: row.x,
						y: row.y,
						size: row.size,
						color: row.color
 					});
				}, this);

				this.chart = this.generateScatterGraph(data);
				break;
			case "line":
				_.each(raw.rows, function(row){
					dataRow.values.push([parseFloat(row.x.toFixed(2)), parseInt(row.y)]);
				}, this);
				this.chart = this.generateLineGraph(data);
				break;
			default: alert("Plot Canvas Problem: Wrong Plot Type");
		}
	},
	
	generateScatterGraph: function(data){
		if(!chart){
			var chart = nv.models.scatterChart()
			                  .margin({top: 30, right: 10, bottom: 40, left: 70})
			                  .tooltipXContent(null)
			                  .tooltipYContent(null)
			                  .tooltipContent(_.bind(function(key, x, y, e) { 
			                  			return '<strong> X: </strong>' + this.formatX(e.point.x) 
			                  				+ "</br><strong>Y: </strong>" + this.formatY(e.point.y) 
			                  				+ '</br><strong>Size: </strong>' + this.formatSize(e.point.size) 
			                  				+ "</br> <strong>Color: </strong>" + this.formatColor(e.point.color)
			                  			}, this))
			                  .showLegend(false)
			                  .xScale(d3.fisheye.scale(this.getXScale()).distortion(0))
			                  .yScale(d3.fisheye.scale(this.getYScale()).distortion(0))
			                  .sizeScale(this.getSizeScale())
			                  .colorScale(this.getColorScale())
			                  
			                  .xDomain(this.getXDomain(data[0].values.map(function(v){ return v.x }))) //TODO: multiple datasets
			                  .yDomain(this.getYDomain(data[0].values.map(function(v){ return v.y }))) //TODO: multiple datasets
			                  .sizeDomain(this.getSizeDomain(data[0].values.map(function(v){ return v.size }))) //TODO: multiple datasets
			                  .colorDomain(this.getColorDomain(data[0].values.map(function(v){ return v.color }))) //TODO: multiple datasets
			                  
			                  .sizeRange([16, 750])
			                  .colorRange(this.getColorRange())
			  
		    chart.xAxis.tickFormat(this.getXAxisFormat()).axisLabel(this.getXAxisLabel());
		    chart.yAxis.tickFormat(this.getYAxisFormat()).axisLabel(this.getYAxisLabel());
		    
		    chart.dispatch.on("tooltipShow.app", _.bind(function(e){
		    	this.configuration.highlightTrack(e.point.id, e.point.start, e.point.end);
		    }, this));
		    
		    chart.dispatch.on("tooltipHide.app", _.bind(function(e){
		    	this.configuration.clearHighlightTrack();
		    }, this));
		}
	    d3.select(this.$el.selector + ' svg').datum(data).transition().duration(500).call(chart);
	 
	    return chart;
	},
	
	generateLineGraph: function(data){
		var chart = nv.models.cumulativeLineChart()
                   .x(function(d) { return d[0] })
                   .y(function(d) { return d[1] }) //adjusting, 100% is 1.00, not 100 as it is in the data
                   .color(d3.scale.category10().range());
 
	     d3.select(this.$el.selector + ' svg')
	         .datum(data)
	         .transition().duration(500)
	         .call(chart);
		return chart;
	},	
	
	preProcessData: function(data){
		_.each(data.rows, function(row){
			if(this.settings.x == "start_date"){
				row.x = new Date(row.x);
			} else row.x = parseFloat(row.x);
			
			if(this.settings.y == "start_date"){
				row.y = new Date(row.y);
			} else row.y = parseFloat(row.y);
			
			if(this.settings.color == "start_date"){
				row.color = new Date(row.color);
			} else row.color = parseFloat(row.color);
			
			if(this.settings.size == "start_date"){
				row.size = new Date(row.size);
			} else row.size = parseFloat(row.size);
		}, this);	
	},
	
	getXScale: function(){
		switch(this.settings.x){
			case "start_date":
				return d3.time.scale;
			default: return d3.scale.linear;
		}	
	},
	
	getYScale: function(){
		switch(this.settings.y){
			case "start_date":
				return d3.time.scale;
			default: return d3.scale.linear;
		}
	},
	
	getXDomain: function(data){
		var max = Math.max.apply(Math, data);
		var min = Math.min.apply(Math, data);
		
		switch(this.settings.x){
			case "hour":
				return [0, 24];
			case "extract(epoch from tracks.time)":
				return [0, max];
			default: return null;
		}
	},
	
	getYDomain: function(data){
		var max = Math.max.apply(Math, data);
		var min = Math.min.apply(Math, data);

		switch(this.settings.y){
			case "hour":
				return [0, 24];
			case "extract(epoch from tracks.time)":
				return [0, max];	
			default: return null;
		}
	},
	
	getSizeDomain: function(data){
		var max = Math.max.apply(Math, data);
		var min = Math.min.apply(Math, data);

		switch(this.settings.size){
			case "hour":
				return [0, 24];
			case "start_date":
				return [min, max];	
			default: return [0, max];
		}
	},
	
	getColorDomain: function(data){
		var max = Math.max.apply(Math, data);
		var min = Math.min.apply(Math, data);

		switch(this.settings.color){
			case "hour":
				return [0, 24];
			case "start_date":
				return [min, max];	
			default: return [0, max];
		}
	},
	
	getColorRange: function(){
		switch(this.settings.color){
			case "carbon":
				return [d3.hsl(130, .9, .5), d3.hsl(0, .9, .5)];
			case "hour":
				return [d3.hsl(130, .9, .5), d3.hsl(0, .9, .5)];	
			default: return [d3.hsl(0, .9, .5), d3.hsl(130, .9, .5)];	
		}	
	},
	
	getColorScale: function(data){
		switch(this.settings.color){
			case "start_date":
				return d3.time.scale();
			case "hour":
				return d3.scale.linear();	
			default: return d3.scale.linear();
		}
	},
	
	getSizeScale: function(data){
		switch(this.settings.size){
			case "start_date":
				return d3.time.scale();
			default: return d3.scale.linear();
		}
	},
	
	getXAxisFormat: function(){
		switch(this.settings.x){
			case "start_date":
				return d3.time.format('%b-%d');
			case "extract(epoch from tracks.time)":
				return function(t){
					function zeroPad(num) {
					  var zero = 2 - num.toString().length + 1;
					  return Array(+(zero > 0 && zero)).join("0") + num;
					}
			    
				    var hours = Math.floor(t / (60 * 60));
					var remainder = t % (60 * 60);
					
					var minutes = Math.floor(remainder / 60);
					var seconds = Math.floor(remainder % 60);
					
					return zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
				};
			default: return d3.format('.02f');
		}
	},
	
	getYAxisFormat: function(){
		switch(this.settings.y){
			case "start_date":
				return d3.time.format('%b-%d');
			case "extract(epoch from tracks.time)":
				return function(t){
					function zeroPad(num) {
					  var zero = 2 - num.toString().length + 1;
					  return Array(+(zero > 0 && zero)).join("0") + num;
					}
			    
				    var hours = Math.floor(t / (60 * 60));
					var remainder = t % (60 * 60);
					
					var minutes = Math.floor(remainder / 60);
					var seconds = Math.floor(remainder % 60);
					
					return zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
				};	
			case "hour":
				return 	d3.format('d');
			default: return d3.format('.02f');
		}
	},
	
	formatX: function(value){
		switch(this.settings.x){
			case "start_date":
				return d3.time.format('%Y-%m-%d %H:%M')(value);
			case "carbon":
				return d3.format('.02f')(value/1000) + ' kgCO2e';
			case "distance":
				return d3.format('.02f')(value) + ' km';
			case "hour":
				return d3.format('.02f')(value) + ' h';	
			case "extract(epoch from tracks.time)":
				return function(t){
					function zeroPad(num) {
					  var zero = 2 - num.toString().length + 1;
					  return Array(+(zero > 0 && zero)).join("0") + num;
					}
			    
				    var hours = Math.floor(t / (60 * 60));
					var remainder = t % (60 * 60);
					
					var minutes = Math.floor(remainder / 60);
					var seconds = Math.floor(remainder % 60);
					
					return zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
				}(value);			
			default: return d3.format('.02f')(value);
		}
	},
	
	formatY: function(value){
		switch(this.settings.y){
			case "start_date":
				return d3.time.format('%Y-%m-%d %H:%M')(value);
			case "carbon":
				return d3.format('.02f')(value/1000) + ' kgCO2e';
			case "distance":
				return d3.format('.02f')(value) + ' km';
			case "hour":
				return d3.format('.02f')(value) + ' h';	
			case "extract(epoch from tracks.time)":
				return function(t){
					function zeroPad(num) {
					  var zero = 2 - num.toString().length + 1;
					  return Array(+(zero > 0 && zero)).join("0") + num;
					}
			    
				    var hours = Math.floor(t / (60 * 60));
					var remainder = t % (60 * 60);
					
					var minutes = Math.floor(remainder / 60);
					var seconds = Math.floor(remainder % 60);
					
					return zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
				}(value);			
			default: return d3.format('.02f')(value);
		}
	},
	
	formatSize: function(value){
		switch(this.settings.size){
			case "start_date":
				return d3.time.format('%Y-%m-%d %H:%M')(value);
			case "carbon":
				return d3.format('.02f')(value/1000) + ' kgCO2e';
			case "distance":
				return d3.format('.02f')(value) + ' km';
			case "hour":
				return d3.format('.02f')(value) + ' h';			
			case "extract(epoch from tracks.time)":
				return function(t){
					function zeroPad(num) {
					  var zero = 2 - num.toString().length + 1;
					  return Array(+(zero > 0 && zero)).join("0") + num;
					}
			    
				    var hours = Math.floor(t / (60 * 60));
					var remainder = t % (60 * 60);
					
					var minutes = Math.floor(remainder / 60);
					var seconds = Math.floor(remainder % 60);
					
					return zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
				}(value);	
			default: return d3.format('.02f')(value);
		}
	},
	
	formatColor: function(value){
		switch(this.settings.color){
			case "start_date":
				return d3.time.format('%Y-%m-%d %H:%M')(value);
			case "carbon":
				return d3.format('.02f')(value/1000) + ' kgCO2e';
			case "distance":
				return d3.format('.02f')(value) + ' km';
			case "hour":
				return d3.format('.02f')(value) + ' h';			
			case "time":
				return 	
			case "extract(epoch from tracks.time)":
				return function(t){
					function zeroPad(num) {
					  var zero = 2 - num.toString().length + 1;
					  return Array(+(zero > 0 && zero)).join("0") + num;
					}
			    
				    var hours = Math.floor(t / (60 * 60));
					var remainder = t % (60 * 60);
					
					var minutes = Math.floor(remainder / 60);
					var seconds = Math.floor(remainder % 60);
					
					return zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
				}(value);	
			default: return d3.format('.02f')(value);
		}
	},
	
	getXAxisLabel: function(){
		switch(this.settings.x){
			case "start_date":
				return "Date (day)";
			case "carbon":
				return "CO2 Emissions (kgCO2e)";
			case "distance":
				return "Distance (km)";
			case "hour":
				return "Time of Day (h)";
		}
	},
	
	getYAxisLabel: function(){
		switch(this.settings.y){
			case "start_date":
				return "Date (day)";
			case "carbon":
				return "CO2 Emissions (kgCO2e)";
			case "distance":
				return "Distance (km)";
			case "hour":
				return "Time of Day (h)";
		}
	},
	
	render: function(){
		console.log(this.settings.type + " Plot: Rendering");
		this.loadData();
	},
	
	updateSettings: function(settings){
		if(this.settings.type == settings.type && this.settings.x == settings.x && this.settings.y == settings.y && this.settings.size == settings.size && this.settings.color == settings.color){
			return;
		}
		
		this.settings.type = settings.type;
		this.settings.x = settings.x;
		this.settings.y = settings.y;
		this.settings.size = settings.size;
		this.settings.color = settings.color;

		this.render();
	},
	
	resize: function(){
		if(this.chart != null) this.chart.update();
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
		
	}
});

PlotCanvas.prototype.id = "plot";
PlotCanvas.prototype.label = "Plot";
PlotCanvas.prototype.thumb = "thumb_scatter.png"