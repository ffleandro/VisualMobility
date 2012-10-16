$(function(){
	var AppView = Backbone.View.extend({
		el: $("#visualmobility"),
		configuration: null,
		userId: null,
		configFactory: null,
		
		events: {
			"click #settingsView button#close": "closeCanvasSettings",
			"click #settingsView button#save": "saveSettings",
		},
		
		initialize : function(){
			console.log("Initializing VisualMobility");
			_.bindAll(this, 'initialize', 'render', 'resize', 'updateCanvas', 'renderCanvas', "rows", "setConfiguration", "setDefaultUser", "setDefaultConfiguration", 'openCanvasSettings');
			
			this.configFactory = new ConfigurationFactory();
			this.configFactory.fetch({failure: function(model, response) {
				console.error("Error: ");
				console.log(response);
			}});
			
			this.filterFactory = new FilterFactory;
			this.filterFactory.fetch({failure: function(model, response) {
				console.error("Error: ");
				console.log(response);
			}});
						
			//this.configFactory.clear();
			//this.filterFactory.clear();
			
			var row1col1 = $("#row1 #col1");
			var row1col2 = $("#row1 #col2");
			var row2col1 = $("#row2 #col1");
			var row2col2 = $("#row2 #col2");
			
			this.updateCanvas();
			
			var headerHeight = $('#header').outerHeight(true);
			$('#canvas').height(parseInt($(window).height() - headerHeight)); /* Hack. Can this be avoided using CSS? */
			
			$(window).resize(_.bind(function() {
				this.resize();
			}, this));
		},
		
		setConfiguration: function(config){
			var configId = parseInt(config);
			var configuration = this.configFactory.get(configId);
			this.configuration = configuration;
			
			if(this.configuration == null) {
	    		alert("Invalid Configuration id: " + config);
	    		this.setDefaultConfiguration();
	    	}
		},
		
		setDefaultUser: function(){
			this.userId = 2;
		},
		
		setDefaultConfiguration: function(){
			console.log("App Default Config");
			var config = this.configFactory.defaultConfiguration(this.userId);
			this.configuration = config;
			this.setFilter();
			this.render();
		},
		
		setFilter: function(id){
			console.log("App: Changing Filter: " + id);
			if(typeof id === 'undefined') {
				console.log("Setting Blank Filter");
				this.configuration.set({filter: new Filter()});
			} else {
				console.log("Fetching Filter");
				console.log(this.filterFactory.get(id));
				this.configuration.set({filter: this.filterFactory.get(id)});
				if(this.configuration.get('filter') == null) alert("Error getting filter from factory");	
			}
			Sidepanel.setFilter(this.configuration.get('filter'));
		},
		
		addCanvas: function(index, canvas){
			this.configuration.addCanvas(index, canvas);
			canvas.userId = this.userId;
			this.updateCanvas();
			canvas.render();
		},
		
		removeCanvas: function(index){
			this.configuration.removeCanvas(index);
			this.updateCanvas();	
			this.render();
		},
		
		/* Should only be called after all objects are initialized
		 * For App initialization use this.initialize()
		 */
		renderCanvas: function(){
			if(this.userId != null){
				/* this.updateCanvas();*/ //TODO: create separate View for Canvas
				this.configuration.render();
			}
		},
		
		/* Should only be called after all objects are initialized
		 * For App initialization use this.initialize()
		 */
		render: function(){
			if(this.userId != null){
				this.renderCanvas();
				Sidepanel.render();
				this.updateCanvas();
			}
		},
		
		resize: function(){
			this.configuration.resize();
		},
		
		rows: function(){
			if(!this.configuration) return 0;
			
			var nRows = 0;
			nRows += (this.configuration.canvas[0] || this.configuration.canvas[1]) ? 1 : 0;
			nRows += (this.configuration.canvas[2] || this.configuration.canvas[3]) ? 2 : 0;
			return nRows;
		},
		
		updateCanvas: function(){
			if(!this.configuration) return;
			
			console.log("App: Updating Canvas");
			var c = this.configuration.canvas;
			var rows = this.rows(); //1, 2 or 3 = both
			
			var sidepanelOpened = $('#sidepanel').hasClass("open");
			
			$("#canvas .row").removeClass("halfheight fullheight").addClass("disabled");
			$("#canvas .cell").removeClass("halfwidth fullwidth").addClass("disabled");
			switch(rows){
				case 0:
					console.log("No Configuration");
					break;
				case 1:
					$("#canvas #row1").addClass("fullheight").removeClass("disabled");
					break;
				case 2:
					$("#canvas #row2").addClass("fullheight").removeClass("disabled");
					break;
				case 3:
					$("#canvas .row").addClass("halfheight").removeClass("disabled");
					break;			
			}
			
			for(var r = 0; r < 2 && rows != 0; r++){
				if(c[2*r+0] && c[2*r+1]){
					$("#canvas #row" + (r+1) + " .cell").addClass("halfwidth").removeClass("disabled");
				} else if(c[2*r+0]){
					$("#canvas #row" + (r+1) + " #col1").addClass("fullwidth").removeClass("disabled");
				} else if(c[2*r+1]){
					$("#canvas #row" + (r+1) + " #col2").addClass("fullwidth").removeClass("disabled");
				}
			}
			
			var width = $(window).width() - (sidepanelOpened ? $('#sidepanel').width() : 0);
			var height = $(window).height() - $('#header').outerHeight(true);
			
			$('#canvas .disabled').height(0).width(0).css("display", "none");
			
			$('#canvas .row.halfheight').height(height/2).width(width).css("display", "block");
			$('#canvas .row.fullheight').height(height).width(width).css("display", "block");
			$('#canvas .row.halfheight .cell.halfwidth').height(height/2-8).width(Math.floor(width/2-8)).css("display", "inline-block");
  			$('#canvas .row.halfheight .cell.fullwidth').height(height/2-8).width(Math.floor(width-8)).css("display", "inline-block");
  			$('#canvas .row.fullheight .cell.halfwidth').height(height-4).width(Math.floor(width/2-8)).css("display", "inline-block");
  			$('#canvas .row.fullheight .cell.fullwidth').height(height-4).width(Math.floor(width-8)).css("display", "inline-block");
  			this.resize();
		},
		
		openCanvasSettings: function(index){
			this.canvasSettings = this.configuration.canvas[index];
			var settings = this.canvasSettings.settings;
			
			$('#settingsView').removeClass('disabled').addClass('enabled');
			$('#settingsView div').removeClass('enabled').addClass('disabled');
			$('#settingsView div#' + settings.id).removeClass('disabled').addClass('enabled');
			
			switch(settings.id){
				case "plot":
					var xValues = [ {key: "distance", value: "Distance"},
									{key: "start_date", value: "Date"},
									{key: "hour", value: "Time"},
									{key: "carbon", value: "CO2"},
									{key: "extract(epoch from tracks.time)", value: "Duration"}];
									
					var yValues = [ {key: "distance", value: "Distance"},
									{key: "start_date", value: "Date"},
									{key: "hour", value: "Time"},
									{key: "carbon", value: "CO2"},
									{key: "extract(epoch from tracks.time)", value: "Duration"}];
									
					var sizeValues = [ {key: "distance", value: "Distance"},
									{key: "start_date", value: "Date"},
									{key: "hour", value: "Time"},
									{key: "carbon", value: "CO2"},
									{key: "extract(epoch from tracks.time)", value: "Duration"}];
									
					var colorValues = [ {key: "distance", value: "Distance"},
									{key: "start_date", value: "Date"},
									{key: "hour", value: "Time"},
									{key: "carbon", value: "CO2"},
									{key: "extract(epoch from tracks.time)", value: "Duration"}];								
									
									
					/*
					var typeSelect = $('div#plot select#type'); // TODO: dynamicly populate combobox
										typeSelect.html("");
										typeSelect.append('<option id="scatter"' + ("scatter"==settings.type ? ' selected="selected"' : '') + '>Scatter</option>');
										typeSelect.append('<option id="line"' + ("line"==settings.type ? ' selected="selected"' : '') + '>Line</option>');
					*/
					

					var xSelect = $('div#plot select#x');
					xSelect.html("");
					_.each(xValues, function(option){
						xSelect.append('<option id="' + option.key + '"' + (option.key==settings.x ? ' selected="selected"' : '') + '>' + option.value + '</option>');
					});
					
					var ySelect = $('div#plot select#y');
					ySelect.html("");
					_.each(yValues, function(option){
						ySelect.append('<option id="' + option.key + '"' + (option.key==settings.y ? ' selected="selected"' : '') + '>' + option.value + '</option>');
					});
					
					var sizeSelect = $('div#plot select#size');
					sizeSelect.html("");
					_.each(sizeValues, function(option){
						sizeSelect.append('<option id="' + option.key + '"' + (option.key==settings.size ? ' selected="selected"' : '') + '>' + option.value + '</option>');
					});
					
					var colorSelect = $('div#plot select#color');
					colorSelect.html("");
					_.each(colorValues, function(option){
						colorSelect.append('<option id="' + option.key + '"' + (option.key==settings.color ? ' selected="selected"' : '') + '>' + option.value + '</option>');
					});
					
					break;
				case "map":
					/*
var typeSelect = $('div#map select#type');
					typeSelect.html("");
					typeSelect.append('<option id="TERRAIN"' + ("TERRAIN"==settings.type ? ' selected="selected"' : '') + '>Terrain</option>');
					typeSelect.append('<option id="ROADMAP"' + ("ROADMAP"==settings.type ? ' selected="selected"' : '') + '>RoadMap</option>');
					typeSelect.append('<option id="SATELLITE"' + ("SATELLITE"==settings.type ? ' selected="selected"' : '') + '>Satellite</option>');
					typeSelect.append('<option id="HYBRID"' + ("HYBRID"==settings.type ? ' selected="selected"' : '') + '>Hybrid</option>');
					
					if(settings.heatmap) $('input:checkbox#heatmap').attr('checked', 'checked');
					if(settings.tracks) $('input:checkbox#tracks').attr('checked', 'checked');
*/
					if(settings.cluster) $('input:checkbox#cluster').attr('checked', 'checked');
					
					break;	
			}
		},
		
		closeCanvasSettings: function(){
			$('#settingsView').removeClass('enabled').addClass('disabled');
		},
		
		saveSettings: function(){
			$('#settingsView').removeClass('enabled').addClass('disabled');

			var settings = {};
			switch(this.canvasSettings.settings.id){
				case "plot":
					settings.type = "scatter";//$('#settingsView select#type option:selected').attr('id');
					settings.x = $('#settingsView select#x option:selected').attr('id');
					settings.y = $('#settingsView select#y option:selected').attr('id');
					settings.size = $('#settingsView select#size option:selected').attr('id');
					settings.color = $('#settingsView select#color option:selected').attr('id');
					break;
				case "map":
					settings.cluster = $('#settingsView input:checkbox#cluster').attr('checked') == 'checked';
					break;	
			}
			
			this.canvasSettings.updateSettings(settings);
		}
	});
	var App = new AppView;

	var HeaderView = Backbone.View.extend({
	    el: $("#header"),
	    
	    events: {
	      "click #share": "shareviz",
	      "click #about": "about"
	    },

	    initialize: function() {
	    	
		},
		
		shareviz: function() {
			
		},
    
	    about: function() {

	    }
	});
	var Header = new HeaderView;
	
	var SideMenuView = Backbone.View.extend({
	    buttonArrow: $("#sidepanel_btn #arrow"),
	    el: null,
	    
	    tabs: [ ],
	    tabsContent: [ ],
	    activeTab: null,
	    defaults : function(){
			return {
				tab: 0,
			};
		},
	    
	    events: {
	      "click #sidepanel_btn": "sidepanelBtnClicked",
	      "click button.tab": "tabClicked"
	    },

	    initialize: function() {
	    	_.bindAll(this, "sidepanelBtnClicked", "tabClicked", "setFilter");
	    	this.tabs = [$("#filterTab"), $("#configureTab"), $("#saveTab")];
	    	this.tabsContent = [$("#filterContent"), $("#configureContent"), $("#saveContent")];
	    	
	    	this.activeTab = this.defaults().tab;
	    	this.tabs[this.activeTab].addClass("selected");
	    	this.tabsContent[this.activeTab].addClass("selected");
	    	
	    	var pos = ($(window).height()-$('#header').height())/2 - 8;
	    	$('#sidepanel #sidepanel_btn').css('top', pos);
		},
		
		sidepanelBtnClicked: function() {
			var width = $(window).width();
			var height = $(window).height()-$('#header').outerHeight(true)
			
			var nRows = App.rows();
			
			var fCnt = 0;
			var finishCallback = function(){ //Ugly and not safe. Jquery synchronized animations? Does that even exist?
				if(++fCnt < 4) return;
				fCnt = 0;
				App.resize();
			}
			
			if(this.$el.hasClass("open")){
				this.$el.animate({right: '-400px'}, 1000, 'swing', finishCallback);
				$('#canvas .row').animate({width: width}, 1000, 'swing', finishCallback);
				$('#canvas .cell.halfwidth').animate({width: Math.floor(width/2-8)}, 1000, 'swing', finishCallback);
				$('#canvas .cell.fullwidth').animate({width: Math.floor(width-8)}, 1000, 'swing', finishCallback);
				this.$el.removeClass("open");
				this.$el.addClass("close");
			} else {
				width = $(window).width()-this.$el.width();
				this.$el.animate({right: '0px'}, 1000, 'swing', finishCallback);
				$('#canvas .row').animate({width: width}, 1000, 'swing', finishCallback);
				$('#canvas .cell.halfwidth').animate({width: Math.floor(width/2-8)}, 1000, 'swing', finishCallback);
				$('#canvas .cell.fullwidth').animate({width: Math.floor(width-8)}, 1000, 'swing', finishCallback);
				this.$el.removeClass("close");
				this.$el.addClass("open");
			}
		},
		
		tabClicked: function(event){
			this.tabs[this.activeTab].removeClass("selected");
	    	this.tabsContent[this.activeTab].removeClass("selected");
			
			var id = event.currentTarget.getAttribute("id");
			for(var i = 0; i < this.tabs.length; i++){
				if(this.tabs[i].attr('id') == id){
					this.activeTab = i;
					this.tabs[this.activeTab].addClass("selected");
					this.tabsContent[this.activeTab].addClass("selected");
					
					break;
				}
			}
		},
		
		setFilter: function(f){
			FilterTab.setFilter(f);
			ConfigureTab.setFilter(f);
			SaveTab.setFilter(f);
		},
		
		render: function(){
			FilterTab.render();
			ConfigureTab.render();
			SaveTab.render();
		}
	});
	Sidepanel = new SideMenuView({el: $("#sidepanel")});
	
	var FilterView = Backbone.View.extend({
		el: $('#filterContent'),
		
		initialize: function(){
			this.el = $('#filterContent');
			this.locationFilter = new LocationController({el: $("#locationFilter")});
			this.dateFilter = new DateController({el: $("#dateFilter")});
			this.timeFilter = new TimeController({el: $("#timeFilter")});
			this.distanceFilter = new DistanceController({el: $("#distanceFilter")});
			this.durationFilter = new DurationController({el: $("#durationFilter")});
			this.transportFilter = new TransportController({el: $("#locationFilter")});
			this.carbonFilter = new CarbonController({el: $("#carbonFilter")});
			
			var locHeight = this.locationFilter.el.height();
			var height = $(window).height() - this.el.offset().top;
			this.el.height(height);
			var othersHeight = (height-locHeight - 25*7) / 6;
			
			var width = this.el.width() - 3;

			/* this.locationFilter.el.height(locHeight); */
			this.locationFilter.el.width(width);			
			
			this.dateFilter.el.height(othersHeight);
			this.dateFilter.el.width(width);
			
			this.timeFilter.el.height(othersHeight);
			this.timeFilter.el.width(width);
			
			this.distanceFilter.el.height(othersHeight);
			this.distanceFilter.el.width(width);
			
			this.durationFilter.el.height(othersHeight);
			this.durationFilter.el.width(width);
			
			this.transportFilter.el.height(othersHeight);
			this.transportFilter.el.width(width);
			
			this.carbonFilter.el.height(othersHeight);
			this.carbonFilter.el.width(width);
		},
		
		setFilter: function(filter){
			this.filter = filter;
		},
		
		render: function(){
			this.locationFilter.userId = App.userId;
			this.locationFilter.setFilter(this.filter);
			
			this.dateFilter.userId = App.userId;
			this.dateFilter.setFilter(this.filter);
			
			this.timeFilter.userId = App.userId;
			this.timeFilter.setFilter(this.filter);
			
			this.distanceFilter.userId = App.userId;
			this.distanceFilter.setFilter(this.filter);
			
			this.durationFilter.userId = App.userId;
			this.durationFilter.setFilter(this.filter);
			
			this.transportFilter.userId = App.userId;
			this.transportFilter.setFilter(this.filter);
			
			this.carbonFilter.userId = App.userId;
			this.carbonFilter.setFilter(this.filter);
		}
	});
		
	var ConfigureView = Backbone.View.extend({
		el: $("#configureContent"),
		pickers: [$('#layoutPicker #0.cell'), $('#layoutPicker #1.cell'), $('#layoutPicker #2.cell'), $('#layoutPicker #3.cell')],
		availableCanvas: [MapCanvas, PlotCanvas, ChordCanvas],
	    
	    events: {
	      "click #layoutPicker .cell button": "openSettings"
	    },

	    initialize: function() {
	    	_.bindAll(this, 'droppedThumbnail', 'initThumbnails', 'addThumbnailDraggable', 'render');
	    	this.initThumbnails();
		},
		
		initThumbnails: function(){
			_.each(this.availableCanvas, function(canvas, key){
				var id = canvas.prototype.id,
					label = canvas.prototype.label,
					thumb = canvas.prototype.thumb;
				$('#viscontainer').append('<div id="' + id + '" class="thumbnail" style="background: url(assets/img/' + thumb + ') no-repeat;"><p>' + label + '</p></div>');
				this.addThumbnailDraggable(id);
	    	}, this);
		},
		
		addThumbnailDraggable: function(id){
			var thumbnail = $('#viscontainer #' + id); 
			
			thumbnail.draggable({
							helper: 'clone',
							stop: this.droppedThumbnail
			});
		},
		
		openSettings: function(evt){
			var index = evt.currentTarget.parentNode.id;
			App.openCanvasSettings(index);
		},
		
		setFilter: function(filter){
			//Ignore. Currently no need of filter
		},
		
		render: function(){
			this.refreshLayoutPicker();	
		},
		
		refreshLayoutPicker: function(){
			for(var i = 0; i < this.pickers.length; i++){
				var picker = this.pickers[i];
	    		var canvas = App.configuration ? App.configuration.canvas[i] : null;
		    	if(canvas){
		    		var thumbnail = $('<div id="' + canvas.id + '" class="thumbnail" style="background: url(assets/img/' + canvas.thumb + ') no-repeat;"><p>' + canvas.label + '</p></div>');
			    	thumbnail.draggable({helper: 'clone', stop: this.droppedThumbnail}).appendTo(picker).offset({left: picker.offset().left, top: picker.offset().top});
			    	picker.append('<button class="btn-settings"><img src="assets/img/btn_settings.png"></img></button>');
		    	} else picker.html("");
	    	}
		},
		
		droppedThumbnail: function(ev, ui){
			var centerx = ui.offset.left + ui.helper.width()/2,
				centery = ui.offset.top + ui.helper.height()/2;
			
			var found = false;
			_.each(this.pickers, function(picker){
				var left = picker.offset().left,
				    right = picker.offset().left + picker.width(),
				    top = picker.offset().top,
				    bottom = picker.offset().top + picker.height();
				
				if(centerx > left && centerx < right && centery > top && centery < bottom && ui.helper.parent().attr('id') == picker.attr('id')){
					found = true;
				} else if(centerx > left && centerx < right && centery > top && centery < bottom && ui.helper.parent().attr('id') != picker.attr('id')){ 
					var thumb = $(ui.helper).clone();
					if($(ui.helper).parent().parent().attr('id') == "layoutPicker"){
						var index = $(ui.helper).parent().attr('id');
						$(ui.helper).parent().empty();
						App.removeCanvas(index);	
						found = true;
					}
					thumb.draggable({helper: 'clone', stop: this.droppedThumbnail}).appendTo(picker).offset({left: left, top: top});
					picker.append('<button class="btn-settings"><img src="assets/img/btn_settings.png"></img></button>');
					
					_.each(this.availableCanvas, function(canvas){
						if(canvas.prototype.id == thumb.attr('id')){
							var index = picker.attr('id');
							var selector;
							switch(index){
								case "0":
									selector = $('#canvas #row1 #col1');
									break;
								case "1":
									selector = $('#canvas #row1 #col2');
									break;	
								case "2":
									selector = $('#canvas #row2 #col1');
									break;
								case "3":
									selector = $('#canvas #row2 #col2');
									break;		
							}
							var canvas = new canvas({el: selector});
							App.addCanvas(index, canvas);
						}
					}, this);
				}
			}, this);
			
			if($(ui.helper).parent().parent().attr('id') == "layoutPicker" && !found){
				var index = $(ui.helper).parent().attr('id');
				$(ui.helper).parent().empty();
				App.removeCanvas(index);
			}
		},
		
		toggleCanvas0: function(index){
			App.toggleCanvas(0);
			this.refreshLayoutPicker();
		},
		
		toggleCanvas1: function(index){
			App.toggleCanvas(1);
			this.refreshLayoutPicker();
		},
		
		toggleCanvas2: function(index){
			App.toggleCanvas(2);
			this.refreshLayoutPicker();
		},
		
		toggleCanvas3: function(index){
			App.toggleCanvas(3);
			this.refreshLayoutPicker();
		}
	});
	
	var SaveView = Backbone.View.extend({
		el: $("#saveContent"),
		listcellTemplate: _.template($('#listcell-template').html()),
	    
	    events: {
	      "click #filter button#delete": "deleteFilter",
	      "click #filter button#save": "saveFilter",
	      "click .listcell": "selectedListcell"
	    },

	    initialize: function() {
	    	this.el = $('saveContent');
	    	this.el.height(this.el.height()-50);
	    	$('#saveContent').height($('.tabContent').height()-$("#sidepanel_tabs").height());
	    	$(".listview").height($('.listview-container').height()-50); /* Hack. Can this be avoided using CSS? */
	    	$(".listview").width($('#configuration.listview-container').width()-40); /* Hack. Can this be avoided using CSS? */
	    	
	    	App.configFactory.each(function(config){
	    		this.addConfiguration(config);
	    	}, this);
	    	
	    	App.filterFactory.each(function(filter){
	    		this.addFilter(filter);
	    	}, this);
	    	
	    	App.configFactory.bind('add', this.addConfiguration, this);
	    	App.filterFactory.bind('add', this.addFilter, this);
		},
		
		setFilter: function(filter){
			this.filter = filter;
		},
		
		render: function(){
			var id = this.filter.get('id');
			if(!this.filter.isNew()){
				$('.listcell').removeClass('selected');
				$('#' + id + '.listcell').addClass('selected');
			}	
		},
		
		addConfiguration: function(config){
			var view = new ListcellView({model: configuration});
			var el = view.render().el;
	    	$("#configuration.listview").append(el);
		},
		
		addFilter: function(filter){
			var view = new ListcellView({model: filter});
			var el = view.render().el;
	    	$("#filter.listview").append(el);
		},
		
		deleteFilter: function(){
			this.filter.destroy();
		},
		
		saveFilter: function(){
			console.log("Save Filter");
			
			var label = $('div#filter input#new').val();
			if(this.filter.isNew()){
				console.log("Creating New Filter");
				this.filter.set({id: App.filterFactory.nextId(), label: label});
				App.filterFactory.create(this.filter);
			} else if(this.filter.get('label') != label){
				console.log("Duplicating Filter");
				var filter = this.filter.clone();
				filter.set({id: App.filterFactory.nextId(), label: label});
				App.filterFactory.create(filter);
				App.setFilter(filter);
			} else if(this.filter.changed){
				console.log("Saving current filter");
				this.filter.save();
			} else console.log("Nothing to save");
		},
		
		selectedListcell: function(evt){
			console.log("selectedListcell");
			var id = evt.currentTarget.getAttribute("id");
			App.setFilter(id);
		}
	});
	
	var ListcellView = Backbone.View.extend({
		template: _.template($('#listcell-template').html()),
		
		initialize: function() {
	      this.model.bind('change', this.render, this);
	      this.model.bind('destroy', this.remove, this);
	    },
	
	    // Re-render the titles of the todo item.
	    render: function() {
	      this.$el.html(this.template(this.model.toJSON()));
	      return this;
	    },
	});
	
	/* TODO: create and initialize these tabs inside Sidepanel constructor */
	var FilterTab = new FilterView();
	var ConfigureTab = new ConfigureView();
	var SaveTab = new SaveView();
	
	var Router = Backbone.Router.extend({
	  	routes: {
	  		"": "defaultUserConfiguration",
		  	"edit/:id": "setUser",
		  	"edit/:id/:configuration": "setUserWithConfiguration",
		  	"edit/:id/:configuration/:filter": "setUserWithConfigurationAndFilter"
	    },
	    
	    initialize: function(){
		    _.bindAll(this);
	    },
	    
	    defaultUserConfiguration: function(){
	    	console.log("Setting Default Configuration");
	    	App.setDefaultUser();
		    App.setDefaultConfiguration();
	    },
	    
	    setUser: function(id) {
	    	console.log("Setting User: " + id + "With Default Configuration");
	    	App.userId = id;
	    	App.setDefaultConfiguration();
	    },
	    
	    setUserWithConfiguration: function(id, configuration) {  
	    	console.log("Setting User: " + id + " With Configuration: " + configuration);
	    	App.userId = id;
	    	App.setConfiguration(configuration);
	    },
	    
	    setUserWithConfigurationAndFilter: function(id, configuration, filter) {
	    	console.log("Setting User: " + id + " With Configuration: " + configuration + " And Filter: " + filter);  
	    	App.userId = id;
	    	App.setConfiguration(configuration);
	    	App.configuration.set({filter: App.filterFactory.get(filter)});
	    	
	    	if(App.configuration == null) {
	    		App.setDefaultConfiguration();
	    		alert("Invalid Configuration id: " + configuration);
	    	}
	    }
	});
	var AppRouter = new Router;
	Backbone.history.start();
});