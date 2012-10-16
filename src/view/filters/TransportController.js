var TransportController = FilterController.extend({
	values: [],
	controller: null,
	canvas: null,
	
	initialize: function(){
		_.bindAll(this, 'initialize', 'statement', 'render', 'update', 'loadData', 'loadedData', 'toggleTransportMode');
		this.el = $("#transportFilter");
	},
	
	loadData: function(){
		$.get(this.statement(), this.loadedData);
	},
	
	loadedData: function(data){
		this.values = [];
		
		var i = 0;
		for(key in transportColors){
			this.values[i] = [0, key];	
			i++;
		}
		
/* 		console.log(this.values); */
		
		for(var i = 0; i < data.rows.length; i++){
        	var row = data.rows[i];
        	for(var j = 0; j < this.values.length; j++){
	        	if(this.values[j][1] == row.transport_mode){
		     		this.values[j][0] = row.time;
	        	}
        	}
        }
        
/*         console.log(this.values); */
        
        if(this.canvas == null){
	        this.canvas = new Raphael(this.el.get(0));
			this.controller = new BarsWithToggleController(this.values, this.canvas, this.colorGenerator, this.timeLabelGenerator, this.transportModeLabelGenerator, this.toggleTransportMode);
		} else {
			this.controller.updateValues(this.values);
		}
    },
    
    statement: function(){
		var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.date AS start_date, ends.date AS end_date, starts.location_name AS start_name, ends.location_name AS end_name, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ) SELECT segments.transport_mode, SUM(EXTRACT(EPOCH FROM segments.time)/60) AS time FROM tracks JOIN segments ON tracks.id=segments.track_id WHERE ";
		
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
		
		sql += " GROUP BY segments.transport_mode";
		return encodeUrl(sql);
	},
	
	colorGenerator: function(value, index){
		return "hsl(" + transportColors[index] + ")";
	},
	
	timeLabelGenerator: function(value){
		var days = Math.floor(value / (60 * 24));
		var remainder = value % (60 * 24);
		
		var hours = Math.floor(remainder / 60);
		var minutes = Math.floor(remainder % 60);
		
		var str = "";
		str += days > 0 ? days + "d " : "";
		str += hours > 0 ? hours + "h " : "";
		str += minutes > 0 ? minutes + "m" : "";
		return str.length > 0 ? str : "0m";
	},
	
	transportModeLabelGenerator: function(value){
		return value; //Do nothing
	},
	
	toggleTransportMode: function(transportMode){
		this.filter.toggleTransportMode(transportMode);
		this.controller.updateValues(this.values);
	},
	
	render: function(){
		if(this.canvas != null) this.canvas.clear();
    	this.canvas = null;
    	this.controller = null;
    	this.loadData();
	},
	
	update: function(){
		this.loadData();
	},
});