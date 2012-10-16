var FilterController = Backbone.View.extend({
	userId: null,
	filter: null,
	
	loadData: function(){
		$.get(this.statement(), this.loadedData);
	},
	
	setFilter: function(filter){
		if(this.filter != null) this.filter.off("change", this.update);
		this.filter = filter;
		this.filter.on("change", this.update);
		this.render();
	}
});