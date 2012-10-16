var DurationController = FilterController.extend({
	values: [],
	canvas: null,
	controller: null,

	initialize: function(){
		_.bindAll(this, 'loadData', 'loadedData', 'render', 'initialize', "changeMinDuration", "changeMaxDuration", "update", "intervalLabelGenerator");
		this.el = $("#durationFilter");
	},
	
	statement: function(){
		var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH RECURSIVE segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.location_name AS start_name, ends.location_name AS end_name, starts.date AS start_date, ends.date AS end_date, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ), tracks_interval AS ( SELECT MAX(extract(epoch from tracks.time))/20 AS interval, MAX(extract(epoch from tracks.time)) AS max FROM tracks WHERE ";
		
		sql += this.filter.userFiltering(this.userId);
		
		sql += " ), numbers ( n ) AS ( SELECT cast(0 as double precision) UNION ALL SELECT n + tracks_interval.interval FROM numbers,tracks_interval WHERE n+tracks_interval.interval < tracks_interval.max ), filtered_tracks AS ( SELECT extract(epoch from tracks.time) AS duration, interval FROM tracks, tracks_interval WHERE ";
		
		sql += this.filter.userFiltering(this.userId);
		sql += this.filter.minDateFiltering();
		sql += this.filter.maxDateFiltering();
		sql += this.filter.minTimeFiltering();
		sql += this.filter.maxTimeFiltering();
		sql += this.filter.minDistanceFiltering();
		sql += this.filter.maxDistanceFiltering();
		sql += this.filter.minCarbonFiltering();
		sql += this.filter.maxCarbonFiltering();
		sql += this.filter.startLocationFiltering();
		sql += this.filter.endLocationFiltering();
		sql += this.filter.transportModeFiltering();
		
		sql += ") SELECT COUNT(filtered_tracks.*) AS cnt, numbers.n FROM filtered_tracks RIGHT OUTER JOIN numbers ON (filtered_tracks.duration >= numbers.n AND filtered_tracks.duration < numbers.n+filtered_tracks.interval) GROUP BY numbers.n ORDER BY numbers.n";
		console.log(sql);
		return encodeUrl(sql);
	},
	
	loadedData: function(data){
		console.log("LoadedTracksByDuration in " + data.time + " seconds.");
		this.values = [];
		
		this.interval = data.rows[1].n;
		for(var i=0; i < data.rows.length; i++){
        	var row = data.rows[i];
        	this.values[i] = [row.cnt, row.n];
        }
        
        if(this.controller == null){
			this.canvas = new Raphael(this.el.get(0));
			this.controller = new BarsWithSlidersController(this.values, this.canvas, this.colorGenerator, this.distanceLabelGenerator, this.intervalLabelGenerator, this.changeMinDuration, this.changeMaxDuration, this.filter.get('minDuration'), this.filter.get('maxDuration'));
	    } else {
		    this.controller.updateValues(this.values);
	    }
    },
    
    durationLabelGenerator: function(value){
	    return value + " tracks";
    },
    
    intervalLabelGenerator: function(value){
    	function zeroPad(num) {
		  var zero = 2 - num.toString().length + 1;
		  return Array(+(zero > 0 && zero)).join("0") + num;
		}
    
	    var hours = Math.floor(value / (60 * 60));
		var remainder = value % (60 * 60);
		
		var minutes = Math.floor(remainder / 60);
		var seconds = Math.floor(remainder % 60);
		
		var strFrom = zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
		
		value += this.interval
		hours = Math.floor(value / (60 * 60));
		remainder = value % (60 * 60);
		
		minutes = Math.floor(remainder / 60);
		seconds = Math.floor(remainder % 60);
		
		var strTo = zeroPad(hours) + ":" + zeroPad(minutes) + ":" + zeroPad(seconds);
		
		return strFrom + " - " + strTo;
    },
    
    colorGenerator: function(value){
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
	
	changeMinDuration: function(min){
		console.log("Min: " + min);
		this.filter.set({minDuration: min});
	},
	
	changeMaxDuration: function(max){
		console.log("Max: " + max);
		this.filter.set({maxDuration: max+this.interval});
	}
});