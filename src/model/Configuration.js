var Configuration = Backbone.Model.extend({
	layout: [],
	canvas: [],
	filter: null,
	label: "Configuration",
	
	defaults: function(){
		return {
			canvas: [false, false, false, false]
		}	
	},
	
	initialize: function(){
		_.bindAll(this, 'render', 'resize', 'addCanvas', 'changedFilter', 'distanceByDayStatement', 'removeCanvas');
		this.on("change:filter", this.changedFilter, this);
		
		this.layout = [null, null, null, null];
		this.canvas = [null, null, null, null];// = this.get('canvas');
	},
	
	render: function(){
		var filter = this.get("filter");
		_.each(this.canvas, function(c){
			if(c == null) return;
			c.render();
		});
	},
	
	resize: function(){
		_.each(this.canvas, function(c){
			if(c == null) return;
			c.resize();
		});
	},
	
	addCanvas: function(index, canvas){
		console.log("Adding Canvas: " + index);
		canvas.setFilter(this.get('filter'));
		canvas.configuration = this;
		this.canvas[index] = canvas
		this.layout[index] = true;
	},
	
	removeCanvas: function(index){
		console.log("Removing Canvas: " + index);
		var canvas = this.canvas[index];
		canvas.clear();
		this.canvas[index] = null;
		this.layout[index] = null;
	},
	
	changedFilter: function(){
		console.log("ChangedFilter");
		var filter = this.get("filter");

		_.each(this.canvas, function(c){
			if(c == null) return;
			c.setFilter(filter);
		});
	},
	
	distanceByDayStatement: function(){
		return "http://visualmobility.cartodb.com/api/v2/sql/?q=SELECT SUM(ST_Length(paths.the_geom_webmercator)) AS distance, date_trunc('day', events.date) AS day, to_char(date_trunc('day', events.date), 'DD Mon YYYY') AS daylabel FROM tracks JOIN paths ON tracks.cartodb_id=paths.track_id JOIN events ON tracks.start_event=events.cartodb_id JOIN locations ON events.location_id=locations.cartodb_id WHERE tracks.user_id=" + this.userId + " GROUP BY day ORDER BY day";
	},
    
    highlightTrack: function(id, start, end){
		_.each(this.canvas, function(c){
			if(c == null) return;
			c.highlightTrack(id, start, end);
		});
	},
	
	clearHighlightTrack: function(){
		_.each(this.canvas, function(c){
			if(c == null) return;
			c.clearHighlightTrack();
		});
	}
});

Configuration.prototype.toJSON = function(){
	console.log("Configuration toJSON");
	var obj = Backbone.Model.prototype.toJSON.apply(this);
	
	obj.canvas = [];
	var i = 0;
	this.canvas.forEach(function(value){
		obj.canvas[i] = [value.type, value.el.id];
	});
	
	console.log(obj);
	return obj;
}

Configuration.prototype.parse = function(response){
	console.log("Configuration parse");
	var obj = Backbone.Model.prototype.parse.apply(this, [response]);
	
	var canvas = obj.canvas;
	this.canvas = [];
	canvas.forEach(function(value){
		var type = value[0];
		var el = value[1];
		
		switch(value){
			case "MapCanvas":
				return new MapCanvas($(el));
		}
	});
	
	console.log(this);
	return obj;
}

var ConfigurationFactory = Backbone.Collection.extend({
	model: Configuration,
	localStorage: new Store("Configurations"),
	
	initialize: function(){
			
	},
	
	defaultConfiguration: function(userId){
		var config = new Configuration();
	
		var mapCanvas = new MapCanvas({el: $("#canvas #row1 #col1")});
		mapCanvas.userId = userId;
		mapCanvas.configuration = config;
		
		var chordCanvas = new ChordCanvas({el: $("#canvas #row1 #col2")});
		chordCanvas.userId = userId;
		chordCanvas.configuration = config;
		
		var plotCanvas2 = new PlotCanvas({el: $("#canvas #row2 #col1")});
		plotCanvas2.userId = userId;
		plotCanvas2.configuration = config;

			
		config.canvas[0] = mapCanvas;
		config.layout[0] = true;
		
		config.canvas[1] = chordCanvas;
		config.layout[1] = true;
		
		config.canvas[2] = plotCanvas2;
		config.layout[2] = true;
		
		return config;
	},
	
	nextId: function() {
      if (!this.length) return 1;
      return this.last().get('id') + 1;
    }
});