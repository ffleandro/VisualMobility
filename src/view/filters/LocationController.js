var LocationController = FilterController.extend({
	startInput: $("#locationFilter div#start input"),
	endInput: $("#locationFilter div#end input"),
	locations: [], /* TODO: separate start/end locations */
	statement: function(){
		var sql = "http://visualmobility.cartodb.com/api/v2/sql?q=WITH segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.date AS start_date, ends.date AS end_date, starts.location_name AS start_name, ends.location_name AS end_name, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ) SELECT locations.cartodb_id AS id, locations.name, COUNT(tracks.end_id) AS cnt, locations.the_geom FROM tracks JOIN locations ON (locations.cartodb_id=start_id OR locations.cartodb_id=end_id) WHERE tracks.id IN ( SELECT id FROM tracks WHERE ";
    	
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
    	
    	sql += " ) GROUP BY locations.cartodb_id ORDER BY cnt DESC";
    	
    	return encodeUrl(sql);
	},
	
	events: {
		"click #locationFilter div#start span.tag button": "removeStartTag",
		"click #locationFilter div#end span.tag button": "removeEndTag"
	},
	
	initialize: function(){
		_.bindAll(this, 'initialize', 'statement', 'loadData', 'loadedData', 'startInputKeyUp', 'endInputKeyUp', 'addStartTag', 'addEndTag', 'removeStartTag', 'removeEndTag', 'render', 'update');
		this.el = $("#locationFilter");
		this.startInput = $("#locationFilter div#start input");
		this.endInput = $("#locationFilter div#end input");
		
		this.startInput.keyup(this.startInputKeyUp);
		this.endInput.keyup(this.endInputKeyUp);		
	},
	
	loadedData: function(data){
		console.log("loadedData", data);
		var locations = [];
        for(var i = 0; i < data.rows.length; i++){
        	var row = data.rows[i];
        	locations.push(row);
        }
        
        var getCntByName = function(name){
        	for(var i = 0; i < locations.length; i++){
	        	if(locations[i].name == name) {
	        		return locations[i].cnt;
	        	}
        	}
        	return;
        }
        
        var min = Math.min.apply(Math, locations.map(function(l){ return l.cnt }));
		var max = Math.max.apply(Math, locations.map(function(l){ return l.cnt }));
		
		var colorScale = d3.scale.log().domain([min, max]).interpolate(d3.interpolateHsl).range([d3.hsl(0, .85, .45), d3.hsl(130, .85, .45)]);
        
        this.startInput.autocomplete({
			source: locations.map(function(l){return l.name}),
			minLength: 0,
			autoFocus: true,
			open: function(event, ui){
				$('li.ui-menu-item > a').each(function(i, item){ 
					$(item).css('background', colorScale(parseInt(getCntByName($(item).html()))));
				});
			}
		});
		
		
		this.endInput.autocomplete({
			source: locations.map(function(l){return l.name}),
			minLength: 0,
			autoFocus: true,
			open: function(event, ui){
				$('li.ui-menu-item > a').each(function(i, item){ 
					$(item).css('background', colorScale(parseInt(getCntByName($(item).html()))));
				});
			}
		});
    	
    	this.locations = locations;
    	this.colorScale = colorScale;
	},
	
	startInputKeyUp: function(e) {
		var location = this.startInput.val();
	    if (e.keyCode == 13 && location.length > 0 && this.locations.map(function(l){ return l.name }).contains(location)) {
	    	this.filter.addStartLocation(location);
	    	this.addStartTag(location);
	    }
	},
	
	endInputKeyUp: function(e){
		var location = this.endInput.val();
	    if (e.keyCode == 13 && location.length > 0 && this.locations.map(function(l){ return l.name }).contains(location)) {
	    	this.filter.addEndLocation(location);
	    	this.addEndTag(location);
	    }
	},
	
	addStartTag: function(location){
		var l = null;
		for(var i = 0; i < this.locations.length; i++){
			l = this.locations[i];
			if(location == l.name){
				break;
			}
		}
		
		if(l != null){
	    	this.startInput.before($("<span id='" + l.name + "' class='tag enabled'><span>" + l.name + "</span><button>x</button></span>").css("background", this.colorScale(l.cnt)));
	    } else {
		    this.startInput.before("<span id='" + l.name + "' class='tag disabled'><span>" + l.name + "</span><button>x</button></span>");
	    }
	    this.startInput.val('');
	},
	
	addEndTag: function(location) {
		var l = null;
		for(var i = 0; i < this.locations.length; i++){
			l = this.locations[i];
			if(location == l.name){
				break;
			}
		}

	
    	if(this.locations.map(function(l){ return l.name }).contains(location)){
	    	this.endInput.before($("<span id='" + location + "' class='tag enabled'><span>" + location + "</span><button>x</button></span>").css("background", this.colorScale(l.cnt)));
	    } else {
		    this.endInput.before("<span id='" + location + "' class='tag disabled'><span>" + location + "</span><button>x</button></span>");
	    }
        this.endInput.val('');
	},
	
	removeStartTag: function(event){
		var tag = event.currentTarget.parentNode;
		tag.parentNode.removeChild(tag);
		var location = tag.id;
		this.filter.removeStartLocation(location);
	},
	
	removeEndTag: function(event){
		var tag = event.currentTarget.parentNode;
		tag.parentNode.removeChild(tag);	
		var location = tag.id;
		this.filter.removeEndLocation(location);
	},
	
	render: function(){
		console.log("Rendering");
		this.loadData();
	},	
	
	update: function(){
		this.render();
	}	
});