var Filter = Backbone.Model.extend({
	label: "Filter",
	
	minDate: null,
	maxDate: null,
	minTime: null,
	maxTime: null,
	minCarbonEmissions: null,
	maxCarbonEmissions: null,
	transportModes: null,
	startLocations: null,
	endLocations: null,
	
	defaults: function(){
		return {
			label: "Filter",
			/*
startLocations: ["StartupLisboa", "Casa", "LIDL"],
			endLocations: ["StartupLisboa", "Casa"],
			transportModes: ["Car", "Walk"],
			minTime: 9,
			maxTime: 20,
			minDate: '2012-07-10T00:00:00.000Z',
			maxDate: '2012-07-10T00:00:00.000Z',
			
			maxCarbonEmissions: 2000,
			minDistace: 0,
			maxDistance: 50,
			minDuration: 5000,
			maxDuration: 6000
*/
			
		}
	},

	initialize: function(){
		if(!this.get('startLocations')) this.set('startLocations', []);
		if(!this.get('endLocations')) this.set('endLocations', []);
		if(!this.get('transportModes')) this.set('transportModes', []);
	},
	
	addStartLocation: function(location){
		this.get('startLocations').add(location);
		this.trigger("change");
	},
	
	addEndLocation: function(location){
		this.get('endLocations').add(location);
		this.trigger("change");
	},
	
	removeStartLocation: function(location){
		this.get('startLocations').remove(location);
		this.trigger("change");
	},
	
	removeEndLocation: function(location){
		this.get('endLocations').remove(location);
		this.trigger("change");
	},
	
	toggleTransportMode: function(transportMode){
		this.get('transportModes').toggle(transportMode);
		this.trigger("change");
	},
	
	/*** SQL Query Generator Methods ***/
	userFiltering: function(user){
		return "tracks.user_id=" + user;	
	},
	
	startLocationFiltering: function(){
		var i = 0;
    	var sql = " AND (";
    	_.each(this.get('startLocations'), function(location){
    		sql += i > 0 ? " OR " : "";
	    	sql += ("tracks.start_name='" + location + "'");
	    	i++;
    	});
    	sql += ")";
    	if(i == 0) sql = "";
    	return sql;
	},
	
	endLocationFiltering: function(){
		var i = 0;
    	var sql = " AND (";
    	_.each(this.get('endLocations'), function(location){
    		sql += i > 0 ? " OR " : "";
	    	sql += ("tracks.end_name='" + location + "'");
	    	i++;
    	});
    	sql += ")";
    	if(i == 0) sql = "";
    	return sql;
	},
	
	transportModeFiltering: function(){
		var i = 0;
    	var sql = " AND tracks.id IN (SELECT segments.track_id FROM segments WHERE ";
    	_.each(this.get('transportModes'), function(transportMode){
    		sql += i > 0 ? " OR " : "";
	    	sql += ("segments.transport_mode='" + transportMode + "'");
	    	i++;
    	});
    	sql += ")";
    	if(i == 0) sql = "";
    	return sql;
	},
	
	minDateFiltering: function(){
		var sql = "";
    	if(this.get('minDate') != null){
	    	sql += (" AND tracks.start_date >= '" + this.get('minDate') + "'");
    	}
    	return sql;
	},
	
	maxDateFiltering: function(){
		var sql = "";
    	if(this.get('maxDate') != null){
	    	sql += (" AND tracks.start_date <= '" + this.get('maxDate') + "'::date + interval '1 day' - interval '1 second'");
    	}
    	return sql;
	},
	
	minTimeFiltering: function(){
    	var sql = "";
    	if(this.get('minTime') != null){
	    	sql += (" AND extract(hour from tracks.start_date) >= " + this.get('minTime'));
    	}
    	return sql;
	},
	
	maxTimeFiltering: function(){
		var sql = "";
    	if(this.get('maxTime') != null){
	    	sql += (" AND extract(hour from tracks.start_date) <= " + this.get('maxTime'));
    	}
    	return sql;
	},
	
	minCarbonFiltering: function(){
		var sql = "";
    	if(this.get('minCarbonEmissions') != null){
	    	sql += (" AND tracks.carbon >= " + this.get('minCarbonEmissions'));
    	}
    	return sql;
	},
	
	maxCarbonFiltering: function(){
		var sql = "";
    	if(this.get('maxCarbonEmissions') != null){
	    	sql += (" AND tracks.carbon <= " + this.get('maxCarbonEmissions'));
    	}
    	return sql;
	},
	
	minDistanceFiltering: function(){
		var sql = "";
    	if(this.get('minDistance') != null){
	    	sql += (" AND tracks.distance >= " + this.get('minDistance'));
    	}
    	return sql;
	},
	
	maxDistanceFiltering: function(){
		var sql = "";
    	if(this.get('maxDistance') != null){
	    	sql += (" AND tracks.distance <= " + this.get('maxDistance'));
    	}
    	return sql;
	},
	
	minDurationFiltering: function(){
		var sql = "";
    	if(this.get('minDuration') != null){
	    	sql += (" AND tracks.time >= '" + this.get('minDuration') + " second'::interval");
    	}
    	return sql;
	},
	
	maxDurationFiltering: function(){
		var sql = "";
    	if(this.get('maxDuration') != null){
	    	sql += (" AND tracks.time <= '" + this.get('maxDuration') + " second'::interval");
    	}
    	return sql;
	}
});

var FilterFactory = Backbone.Collection.extend({
	model: Filter,
	localStorage: new Store("Filters"),
	
	nextId: function() {
      if (!this.length) return 1;
      return this.last().get('id') + 1;
    }
});