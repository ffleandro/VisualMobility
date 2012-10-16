var Canvas = Backbone.View.extend({
	userId: null,
	filter: null,
	
	initialize: function(){
		
	},
	
	setFilter: function(filter){
		if(this.filter != null) this.filter.off('change', this.render);
		this.filter = filter;
		this.filter.on('change', this.render);
	},
});