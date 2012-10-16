var TimeController = FilterController.extend({
	values: [],
	canvas: null,
	controller: null,

	initialize: function(){
		_.bindAll(this, 'loadData', 'loadedData', 'render', 'initialize', "changeMinTime", "changeMaxTime", "update");
		this.el = $("#timeFilter");
	},
	
	statement: function(){
		var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH RECURSIVE segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.location_name AS start_name, ends.location_name AS end_name, starts.date AS start_date, ends.date AS end_date, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ), hours ( h ) AS ( SELECT 0 UNION ALL SELECT h+1 FROM hours WHERE h+1 < 24 ), filtered_segments AS ( SELECT ST_Length(ST_Makeline(points.the_geom_webmercator))/1000 AS distance, points.track_id, extract(hour from timestamp) AS hour FROM points WHERE points.track_id IN( SELECT id FROM tracks WHERE ";
		
		
		sql += this.filter.userFiltering(this.userId);
		sql += this.filter.minDateFiltering();
		sql += this.filter.maxDateFiltering();
		sql += this.filter.minCarbonFiltering();
		sql += this.filter.maxCarbonFiltering();
		sql += this.filter.minDistanceFiltering();
		sql += this.filter.maxDistanceFiltering();
		sql += this.filter.minDurationFiltering();
		sql += this.filter.maxDurationFiltering();
		sql += this.filter.startLocationFiltering();
		sql += this.filter.endLocationFiltering();
		sql += this.filter.transportModeFiltering();
		
		sql += ") GROUP BY points.track_id, hour ) SELECT COALESCE(SUM(filtered_segments.distance),0) AS distance, hours.h AS hour FROM filtered_segments RIGHT OUTER JOIN hours ON hours.h=filtered_segments.hour GROUP BY hours.h ORDER BY hours.h";
		
		return encodeUrl(sql);
	},
	
	loadedData: function(data){
		console.log("LoadedDistanceByHour in " + data.time + " seconds.");
		this.values = [];
        for(var i = 0; i < data.rows.length; i++){
        	var row = data.rows[i];
        	this.values[i] = [row.distance.toFixed(2), row.hour];
        }
        
        if(this.controller == null){
			this.canvas = new Raphael(this.el.get(0));
			this.controller = new BarsWithSlidersController(this.values, this.canvas, this.colorGenerator, this.distanceLabelGenerator, this.intervalLabelGenerator, this.changeMinTime, this.changeMaxTime, this.filter.get('minTime'), this.filter.get('maxTime'));
	    } else {
		    this.controller.updateValues(this.values);
	    }
    },
    
    distanceLabelGenerator: function(value){
	    return value + " km";
    },
    
    intervalLabelGenerator: function(value){
	    return value + " - " + (value+1) + "(h)";
    },
    
    colorGenerator: function(value){
        /* return "hsl(" + [.6, .5+value*.3, .30+value*.4] + ")"; */
        return "hsl(" + [value*.36, .9, .5] + ")";
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
	
	changeMinTime: function(min){
		console.log("Min: " + min);
		this.minTime = min;
		this.filter.set({minTime: min});
	},
	
	changeMaxTime: function(max){
		console.log("Max: " + max);
		this.maxTime = max;
		this.filter.set({maxTime: max});
	}
});