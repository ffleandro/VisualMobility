function BarsWithToggleController(values, canvas, colorGenerator, label1Generator, label2Generator, toggleCallback){
	//variables
	this.values = values;
	this.columns = [];
	this.toggled = [],
	this.popup = null;
	this.label = null;
	this.colorGenerator = colorGenerator;
	this.canvas = canvas;
	this.padding = {top: 5, bottom: 5, left: 6, right: 6};
	this.label1Generator = label1Generator;
	this.label2Generator = label2Generator;
	this.toggleCallback = toggleCallback;
	
	var width = this.canvas.width;
	var height = this.canvas.height;
	
	this.max = Math.max.apply(Math, values.map(function(v) {
		return v[0];
	}));
	
	this.X = (width-this.padding.left-this.padding.right) / values.length;
	this.Y = (height-this.padding.top-this.padding.bottom) / this.max;
	
/* 	this.titleLabel = this.canvas.text(width/2, 7, title).attr({font: '12px Helvetica, Arial', fill: "#000"}); */
	
	this.blanket = this.canvas.set();
	for(var i = 0; i < values.length; i++) {
		var valueX = values[i][1];
		var valueY = values[i][0];
		var w = this.X;
    	var h = this.Y * valueY;
    	var x = this.padding.left + i*this.X;
    	var y = height-h-this.padding.bottom;	
    	var color = this.colorGenerator(valueY/this.max, valueX);
	    if(this.toggled.length == 0 || this.toggled.contains(valueX)){ //Or toggled contains
	    	this.columns[i] = this.canvas.rect(x, y, w, h, 1).attr({"stroke-width": 1, "stroke": "#000", fill: color});
	    } else {
		    this.columns[i] = this.canvas.rect(x, y, w, h, 1).attr({"stroke-width": 1, "stroke": "#000", fill: "#000", "fill-opacity": .5});
	    }
	    
	    this.blanket.push(this.canvas.rect(x, this.padding.top, w, height-this.padding.top-this.padding.bottom).attr({stroke: "none", fill: "#FFF", opacity: 0}));
    }
    
    //Draw filter controllers
	this.label = this.canvas.set().hide();
    this.popup = this.canvas.rect(0, 0, 100, 35, 5).attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .6}).hide();
	this.label.push(this.canvas.text(50, 10, "").attr({font: '12px Helvetica, Arial', fill: "#FFF"}));
    this.label.push(this.canvas.text(50, 25, "").attr({font: '12px Helvetica, Arial', fill: "#FFF"}));
    
    var controller = this;
    this.blanket.hover(function(){
    	var x = this.getBBox().x + this.getBBox().width/2;
	    controller.updatePopup(x);
	    controller.showPopUp();
    }, function(){
	    controller.hidePopUp();
    });
    this.blanket.toFront();
    
    this.blanket.click(function(){
    	var x = this.getBBox().x + this.getBBox().width/2;
    	var i;
    	for(i = 0; i < controller.columns.length-1; i++){
	    	var column = controller.columns[i];
	    	var next = controller.columns[i+1];
	    	
	    	if(x >= column.attr("x") && x <= next.attr("x")){
		    	break;	
	    	}
    	}
    	
    	var value = controller.values[i][1];
    	controller.toggled.toggle(value);
    	controller.toggleCallback(value);
    });
}

BarsWithToggleController.prototype.updateValues = function(values){
	this.values = values;
	
	var width = this.canvas.width;
	var height = this.canvas.height;
	this.max = Math.max.apply(Math, this.values.map(function(v) {
		return v[0];
	}));
	
	this.Y = (height-this.padding.top-this.padding.bottom) / this.max;
	
	for(var i = 0; i < this.values.length; i++) {
    	var valueY = this.values[i][0];
    	var valueX = this.values[i][1];
    	var h = this.Y * valueY;
    	var y = height-h-this.padding.bottom;
    	var color = this.colorGenerator(valueY/this.max, valueX);
    	
    	if(this.toggled.length == 0 || this.toggled.contains(valueX)){
	    	this.columns[i].animate({height: h, y: y, fill: color, "fill-opacity": 1}, 500, "<>");
	    } else {
		    this.columns[i].animate({height: h, y: y, fill: "#000", "fill-opacity": .5}, 500, "<>");
	    }
    }
};
	
BarsWithToggleController.prototype.updatePopup = function(x){
	var x1,
		y1 = this.canvas.height/2 - 17,
		minx = this.padding.left,
		maxx = this.canvas.width-this.padding.right;
		
	if(x-50 < minx) x1 = minx;
	else if(x+50 > maxx) x1 = maxx-100;
	else x1 = x-50;
	
	this.popup.transform("t" + x1 + "," + y1);
	this.label.transform("t" + x1 + "," + y1);
	
	var i;
	for(i = 0; i < this.columns.length-1; i++){
		var current = this.columns[i];
		var next = this.columns[i+1];
		
		if(x >= current.attr("x") && x < next.attr("x")){
			break;
		}
	}
	
	var valueY = this.values[i][0];
	var valueX = this.values[i][1];
	var color = this.columns[i].attr("fill");
	
	this.label[0].attr({text: this.label1Generator != null ? this.label1Generator(valueY) : valueY, stroke: color});
	this.label[1].attr({text: this.label2Generator != null ? this.label2Generator(valueX) : valueX})
};

BarsWithToggleController.prototype.toggle = function(x){
	var i;
	for(i = 0; i < this.columns.length-1; i++){
		var current = this.columns[i];
		var next = this.columns[i+1];
		
		if(x >= current.attr("x") && x < next.attr("x")){
			break;
		}
	}
	this.toggleCallback(valueX);
};
	
BarsWithToggleController.prototype.showPopUp = function(){
	this.popup.show();
	this.label.show();
};

BarsWithToggleController.prototype.hidePopUp = function(){
	this.popup.hide();
	this.label.hide();
};