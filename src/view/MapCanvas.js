var MapCanvas = Canvas.extend({
    map: null,
    heatmapOverlay: null,
    heatmapData: null,
    type: "MapCanvas",
    
    defaults: function(){
		return {
			settings: {
				id: "map",
				type: "ROADMAP",
				heatmap: false,
				locations: true,
				tracks: true
			}
		}    
    },
    
    initialize: function() {
	    _.bindAll(this, 'tracksStatement', 'locationsStatement', 'loadedTracksData', 'loadedLocationsData', 'loadedHeatmapData', 'render', 'initialize', 'resize', 'updateSettings', 'zoomToFitBounds', 'highlightTrack');

	    this.settings = this.defaults().settings;
		var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/b73781c9f5ae42339e9d2877273ab5c5/{styleId}/256/{z}/{x}/{y}.png',
		    cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade';
		
		var minimal   = L.tileLayer(cloudmadeUrl, {styleId: 22677, attribution: cloudmadeAttribution}),
		    midnight  = L.tileLayer(cloudmadeUrl, {styleId: 999,   attribution: cloudmadeAttribution}),
		    blackWhite  = L.tileLayer(cloudmadeUrl, {styleId: 19655,   attribution: cloudmadeAttribution});
		    
		    
		
		this.locationsLayer = L.layerGroup();
		this.tracksLayer = L.layerGroup();
		this.heatmapLayer = L.TileLayer.heatMap({
			radius: 15,
			opacity: 0.9
		});
		    
		var layers = [minimal];
		if(this.settings.locations) layers.push(this.locationsLayer);
		if(this.settings.tracks) layers.push(this.tracksLayer);
		if(this.settings.heatmap) layers.push(this.heatmapLayer);
		
		this.map = L.map(this.$el.get(0), {
		    center: new L.LatLng(38.736737, -9.138908),
		    zoom: 12,
		    layers: layers
		});    
		
		
		var baseMaps = {
		    "Night View": midnight,
		    "Minimal": minimal,
		    "Black & White": blackWhite
		};
		
		var overlayMaps = {
		    "Tracks": this.tracksLayer,		
		    "Locations": this.locationsLayer,
		    "Heatmap": this.heatmapLayer
		};
		
		L.control.layers(baseMaps, overlayMaps).addTo(this.map);
	},
	
	tracksStatement: function(){
    	var sql = "http://visualmobility.cartodb.com/api/v2/sql/?format=geojson&q=WITH segments AS (SELECT ST_Makeline(pts.the_geom) AS the_geom, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode=transport_modes.name GROUP BY id, pts.track_id, factor, pts.user_id, transport_mode), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.date AS start_date, ends.date AS end_date, starts.location_name AS start_name, ends.location_name AS end_name, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ) SELECT segments.*, tracks.start_id, tracks.end_id FROM segments JOIN tracks ON segments.track_id=tracks.id WHERE segments.track_id IN (SELECT tracks.id FROM tracks WHERE ";
    	
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
    	
    	sql += " )";
		console.log(sql);
		return encodeUrl(sql);
    },
    
    locationsStatement: function(){
	    var sql = "http://visualmobility.cartodb.com/api/v2/sql?format=geojson&q=WITH segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.date AS start_date, ends.date AS end_date, starts.location_name AS start_name, ends.location_name AS end_name, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ) SELECT locations.cartodb_id AS id, locations.name, COUNT(tracks.end_id) AS cnt, locations.the_geom FROM tracks JOIN locations ON (locations.cartodb_id=start_id OR locations.cartodb_id=end_id) WHERE tracks.id IN ( SELECT id FROM tracks WHERE ";
    	
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
    	
    	sql += " ) GROUP BY locations.cartodb_id ORDER BY cnt ASC";
/*     	console.log(sql); */
		return encodeUrl(sql);
    },
    
    heatmapStatement: function(){
	    var sql = "http://visualmobility.cartodb.com/api/v2/sql/?q=WITH segments AS ( SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator, ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance, transport_modes.factor, transport_mode, (MAX(timestamp)-MIN(timestamp)) AS time, pts.track_id, pts.path_id AS id, pts.user_id FROM (SELECT * FROM points WHERE points.user_id=" + this.userId + " ORDER BY points.track_id, points.path_id, points.timestamp ASC) AS pts JOIN paths ON pts.path_id=paths.cartodb_id JOIN transport_modes ON paths.transport_mode = transport_modes.name GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode ), starts AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack' ), ends AS ( SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack' ), tracks AS ( SELECT segments.track_id AS id, SUM(distance*factor) AS carbon, SUM(distance) AS distance, SUM(segments.time) AS time, starts.location_id AS start_id, ends.location_id AS end_id, starts.date AS start_date, ends.date AS end_date, starts.location_name AS start_name, ends.location_name AS end_name, user_id FROM segments JOIN starts ON starts.track_id=segments.track_id JOIN ends ON ends.track_id=segments.track_id GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name ) SELECT ST_x(geom) AS lon, ST_y(geom) AS lat, count(geom) AS value FROM ( SELECT ST_SnapToGrid(points.the_geom,0.0001) AS geom FROM points WHERE points.track_id IN ( SELECT tracks.id FROM tracks WHERE ";
	    
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
	    
	    sql += ")) AS foo GROUP BY lon, lat";
	    console.log(sql);
		return encodeUrl(sql);
    },
    
    
    render: function(){
		console.log("MapCanvas: Rendering");
		
		d3.json(this.tracksStatement(), this.loadedTracksData);
		d3.json(this.locationsStatement(), this.loadedLocationsData);
		$.get(this.heatmapStatement(), this.loadedHeatmapData);
	},
	
	zoomToFitBounds: function(bounds){
		if(!this.bounds && !bounds) return;
		
		if(bounds) this.map.fitBounds([[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]]);
		else this.map.fitBounds([[this.bounds[0][1], this.bounds[0][0]], [this.bounds[1][1], this.bounds[1][0]]]);
	},
	
	resize: function(){
		console.log("MapCanvas: resize()");
		this.map.invalidateSize(true);
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
	
	loadedTracksData: function(collection){
		console.log("MapCanvas: LoadedTracksData");
		/* console.log(collection); */
		
		this.tracksLayer.clearLayers();
		this.bounds = d3.geo.bounds(collection);
		
		L.geoJson(collection, {
		    style: function(feature){
			    return {
			    	"color"		: hslToRgb(transportColors[feature.properties.transport_mode]),
				    "opacity"	: 1,
				    "weight"	: 2
			    };
		    }
		}).addTo(this.tracksLayer).bringToBack();	
		this.zoomToFitBounds();	
	},
	
	loadedLocationsData: function(collection){
		console.log("MapCanvas: LoadedLocationsData");
		/* console.log(collection); */
		
		this.locationsLayer.clearLayers();
		
		var min = Math.min.apply(Math, collection.features.map(function(feature){ return feature.properties.cnt }));
		var max = Math.max.apply(Math, collection.features.map(function(feature){ return feature.properties.cnt }));
		
		var colorScale = d3.scale.log().domain([min, max]).interpolate(d3.interpolateHsl).range([d3.hsl(0, .9, .5), d3.hsl(130, .9, .5)]);
		var sizeScale = d3.scale.log().domain([min, max]).range([4, 15]);
		
		L.geoJson(collection, {
		    pointToLayer: function (feature, latlng) {
		        return L.circleMarker(latlng, {
		        	color		: "#000",
				    weight		: 1,
				    opacity		: 1,
				    fillOpacity	: 0.8,
					fillColor	: colorScale(feature.properties.cnt),
					radius		: sizeScale(feature.properties.cnt),
				});
		    },
		    onEachFeature: function(feature, layer){
		    	var p = feature.properties;
			    if (p) {
			    	var popupContent = '<b>Location: </b>' + p.name + '</br>';
			    	popupContent += '<b>Check-ins: </b>' + p.cnt + '</br>';
			        layer.bindPopup(popupContent);
			    }
		    }
		}).addTo(this.locationsLayer).bringToFront();
	},
	
	loadedHeatmapData: function(raw){  
    	console.log("MapCanvas: LoadedHeatmapData in " + raw.time + " seconds.");
    	/* console.log(raw.rows); */
    	this.heatmapLayer.addData(raw.rows);
    	this.heatmapLayer
    	this.heatmapLayer.bringToFront();
    },
	
	updateSettings: function(settings){
		if(this.settings.heatmap == settings.heatmap && this.settings.tracks == settings.tracks){
			return;
		}
		
		this.settings.heatmap = settings.heatmap;
		this.settings.tracks = settings.tracks;
	},
	
	highlightTrack: function(id, start, end){
		this.tracksLayer.eachLayer(function(layer){
			var bounds;
			layer.eachLayer(function(tLayer){
				if(id && tLayer.feature.properties.track_id != id){
					tLayer._path.style.display = "none";
				} else if(start && end && tLayer.feature.properties.start_id != end && tLayer.feature.properties.end_id != end){
					tLayer._path.style.display = "none";
				} else {
					var b = d3.geo.bounds(tLayer.feature);
					if(!bounds) bounds = b;
					bounds[0][0] = Math.min(bounds[0][0], b[0][0]);
					bounds[0][1] = Math.min(bounds[0][1], b[0][1]);
					bounds[1][0] = Math.max(bounds[1][0], b[1][0]);
					bounds[1][1] = Math.max(bounds[1][1], b[1][1]);
				}
			});
			this.zoomToFitBounds(bounds);
		}, this);

		this.locationsLayer.eachLayer(function(layer){
			layer.eachLayer(function(lLayer){
				if(start && end && lLayer.feature.properties.id != start && lLayer.feature.properties.id != end){		
					lLayer._path.style.display = "none";
				}
			});
		});
	},
	
	clearHighlightTrack: function(){
		this.tracksLayer.eachLayer(function(layer){
			this.zoomToFitBounds();
			layer.eachLayer(function(tLayer){
				tLayer._path.style.display = "block";
			});
		}, this);
		
		this.locationsLayer.eachLayer(function(layer){
			layer.eachLayer(function(lLayer){
				lLayer._path.style.display = "block";
			});
		});
	}	
});

MapCanvas.prototype.id = "map";
MapCanvas.prototype.label = "Map";
MapCanvas.prototype.thumb = "thumb_map.png"