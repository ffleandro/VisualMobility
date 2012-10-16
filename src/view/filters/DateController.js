var DateController = FilterController.extend({
	values: [],
	canvas: null,
	minDate: null,
	maxDate: null,
	controller: null,

	initialize: function(){
		FilterController.prototype.initialize.call(this);
		_.bindAll(this, 'loadData', 'loadedData', 'render', 'initialize', "changeMinDate", "changeMaxDate", "update");
		this.el = $("#dateFilter");
	},
	
	statement: function(){
		var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH RECURSIVE segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.location_name AS start_name, ends.location_name AS end_name, starts.date AS start_date, ends.date AS end_date, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ), filtered_tracks AS ( SELECT tracks.distance, start_date FROM tracks WHERE ";
		
		sql += this.filter.userFiltering(this.userId);
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
		
		sql += " ), tracks_interval AS ( SELECT MAX(start_date) AS max, MIN(start_date) AS min FROM tracks WHERE ";
		
		sql += this.filter.userFiltering(this.userId);
		
		sql +="), numbers ( n ) AS ( SELECT 1 UNION ALL SELECT 1 + n FROM numbers WHERE n < 1000 ), dates AS ( SELECT date_trunc('day', tracks_interval.max) - interval '1 day' * (n-1) AS date FROM numbers, tracks_interval WHERE date_trunc('day', tracks_interval.max) - interval '1 day' * (n-1) >= date_trunc('day', tracks_interval.min) ) SELECT dates.date AS day, SUM(COALESCE(distance, 0)) AS distance FROM dates LEFT OUTER JOIN filtered_tracks ON date_trunc('day', start_date) = date GROUP BY date ORDER BY date";
		return encodeUrl(sql);
	},
	
	loadedData: function(data){
		console.log("LoadedDistanceByDayData in " + data.time + " seconds.");
		this.values = [];
        for(var i = 0; i < data.rows.length; i++){
        	var row = data.rows[i];
        	this.values.push([(row.distance).toFixed(2), row.day]);
        }
        
        if(this.controller == null){
			this.canvas = new Raphael(this.el.get(0));
			this.controller = new BarsWithSlidersController(this.values, this.canvas, this.colorGenerator, this.distanceLabelGenerator, this.dayLabelGenerator, this.changeMinDate, this.changeMaxDate, this.filter.get('minDate'), this.filter.get('maxDate'));
	    } else {
		    this.controller.updateValues(this.values);
	    }
    },
    
    distanceLabelGenerator: function(value){
		return value + " km";
    },
    
    dayLabelGenerator: function(value){
    	var months = ["Jan", "Fev", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"];
	    var splits = value.split("-");
	    splits[2] = splits[2].split("T")[0];
	    return splits[2] + " " + months[parseInt(splits[1], 10)-1] + " " + splits[0];
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
	
	changeMinDate: function(min){
		this.filter.set({minDate: min});
	},
	
	changeMaxDate: function(max){
		this.filter.set({maxDate: max});
	}
});