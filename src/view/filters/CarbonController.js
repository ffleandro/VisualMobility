var CarbonController = FilterController.extend({
	values: [],
	canvas: null,
	controller: null,

	initialize: function(){
		FilterController.prototype.initialize.call(this);
		_.bindAll(this, 'loadData', 'loadedData', 'render', 'initialize', "changeMinValue", "changeMaxValue", "update", "carbonEmissionsLabelGenerator");
		this.el = $("#carbonFilter");
	},
	
	statement: function(){
		var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH RECURSIVE segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.location_name AS start_name, ends.location_name AS end_name, starts.date AS start_date, ends.date AS end_date, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ), tracks_interval AS ( SELECT MAX(tracks.carbon)/20 AS interval, MAX(tracks.carbon) AS max FROM tracks WHERE ";
		
		sql += this.filter.userFiltering(this.userId);
		
		sql += "), numbers ( n ) AS ( SELECT cast(0 as double precision) UNION ALL SELECT n + tracks_interval.interval FROM numbers,tracks_interval WHERE n+tracks_interval.interval < tracks_interval.max ), filtered_tracks AS ( SELECT tracks.distance, tracks.carbon, interval FROM tracks, tracks_interval WHERE ";
		
		sql += this.filter.userFiltering(this.userId);
		sql += this.filter.minDateFiltering();
		sql += this.filter.maxDateFiltering();
		sql += this.filter.minTimeFiltering();
		sql += this.filter.maxTimeFiltering();
		sql += this.filter.minDurationFiltering();
		sql += this.filter.maxDurationFiltering();
		sql += this.filter.minDistanceFiltering();
		sql += this.filter.maxDistanceFiltering();
		sql += this.filter.startLocationFiltering();
		sql += this.filter.endLocationFiltering();
		sql += this.filter.transportModeFiltering();
		
		sql += ") SELECT COALESCE(SUM(distance), 0) AS distance, numbers.n FROM filtered_tracks RIGHT OUTER JOIN numbers ON ((filtered_tracks.carbon=0 AND numbers.n=0) OR (filtered_tracks.carbon > 0 AND filtered_tracks.carbon <= numbers.n AND numbers.n=filtered_tracks.interval) OR (filtered_tracks.carbon > numbers.n-filtered_tracks.interval AND filtered_tracks.carbon > filtered_tracks.interval AND filtered_tracks.carbon <= numbers.n)) GROUP BY numbers.n ORDER BY numbers.n";
/* 		console.log(sql); */
		return encodeUrl(sql);
	},
	
	loadedData: function(data){
		console.log("LoadedCarbonData in " + data.time + " seconds.");
		/* console.log(data); */
		this.values = [];
        
        this.interval = data.rows[1].n
        for(var i=0; i < data.rows.length; i++){
        	var row = data.rows[i];
        	this.values[i] = [row.distance, row.n];
        }
             
        if(this.canvas == null){
	    	this.canvas = new Raphael(this.el.get(0));    
	    	this.controller = new BarsWithSlidersController(this.values, this.canvas, this.colorGenerator, this.intervalLabelGenerator, this.carbonEmissionsLabelGenerator, this.changeMinValue, this.changeMaxValue);
        } else {
	        this.controller.updateValues(this.values);
        }
    },
    
    carbonEmissionsLabelGenerator: function(value){
		if(value == 0){
			return "0 (g CO2e)";
		} else if(value == this.interval){
			return "0.01 - " + value.toFixed(0) + " (g CO2e)";
		} else if(value < 1000){
			return (value-this.interval).toFixed(0) + " - " + value.toFixed(0) + " (g CO2e)";
		} else return ((value-this.interval)/1000).toFixed(2) + " - " + (value/1000).toFixed(2) + " (kg CO2e)";
    },
    
    intervalLabelGenerator: function(value){
    	return value.toFixed(2) + " km";
    },
    
    colorGenerator: function(value){
        return "hsl(" + [value*.36, .9, .5] + ")";
    },
    
    render: function(){
    	if(this.canvas != null) this.canvas.clear();
    	this.controller = null;
    	this.canvas = null;
    	this.loadData();
	},
	
	update: function(){
		this.loadData();
	},
	
	changeMinValue: function(min){
		if(min == this.interval){
			min = 0.01;
		} else if(min > this.interval) {
			min -= this.interval;
		}
		console.log(min);
		this.filter.set({minCarbonEmissions: min});
	},
	
	changeMaxValue: function(max){
		this.filter.set({maxCarbonEmissions: max});
	}
});