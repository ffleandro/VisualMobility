function BarsWithSlidersController(values, canvas, colorGenerator, label1Generator, label2Generator, minFilterCallback, maxFilterCallback, defaultMin, defaultMax){
	//variables
	this.values = values;
	this.columns = [];
	this.colors = [];
	this.popup = null;
	this.label = null;
	this.colorGenerator = colorGenerator;
	this.canvas = canvas;
	this.padding = {top: 0, bottom: 0, left: 0, right: 0};
	this.label1Generator = label1Generator;
	this.label2Generator = label2Generator;
	this.minFilterCallback = minFilterCallback;
	this.maxFilterCallback = maxFilterCallback;
	this.sliderSize = 9;
	this.padding = {top: 5, bottom: 5, left: 10, right: 10};
	
	this.minIndex = 0;
	this.maxIndex = values.length-1;
	
	for(var i = 0; i < values.length; i++) {
		var value = values[i][1];
		if(value == defaultMin) this.minIndex = i;
		if(value == defaultMax) this.maxIndex = i;
	}
	
	var width = this.canvas.width;
	var height = this.canvas.height;
	
	this.max = Math.max.apply(Math, values.map(function(v) {
		return v[0];
	}));
	
	
	this.X = Math.min(30, (width-this.padding.left-this.padding.right) / values.length);
	this.Y = (height-this.padding.top-this.padding.bottom) / this.max;
	
	this.blanket = this.canvas.set();
	for(var i = 0; i < values.length; i++) {
		var value = values[i][0];
		var w = this.X;
    	var h = this.Y * value;
    	var x = this.padding.left + i*this.X;
    	var y = height-h-this.padding.bottom;	
    	this.colors[i] = this.colorGenerator(value/this.max);
	    
	    if(i >= this.minIndex && i <= this.maxIndex){
	    	this.columns[i] = this.canvas.rect(x, y, w, h, 1).attr({"stroke-width": 1, "stroke": "#000", fill: this.colors[i]});
	    } else {
		    this.columns[i] = this.canvas.rect(x, y, w, h, 1).attr({"stroke-width": 1, "stroke": "#000", fill: "#000", "fill-opacity": .5});
	    }
    }
    
    this.label = this.canvas.set().hide();
    this.popup = this.canvas.rect(0, 0, 120, 35, 5).attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .6}).hide();
/*     filter.popup.transform("t" + (popup.getBBox().width/2*-1) + "," + (filter.popup.getBBox().height*-1));  //Why this no work?*/
	this.label.push(this.canvas.text(60, 10, "").attr({font: '12px Helvetica, Arial', fill: "#FFF"}));
    this.label.push(this.canvas.text(60, 25, "").attr({font: '12px Helvetica, Arial', fill: "#FFF"}));
    
    this.makeBlanket();
    this.makeSliders();
}

BarsWithSlidersController.prototype.updateValues = function(values){
	var sizeDiff = this.values.length - values.length;
	if(sizeDiff != 0) console.log("------> !!!!!! SizeDiff: " + sizeDiff + " !!!!!! <------");
	this.values = values;
	
	var width = this.canvas.width;
	var height = this.canvas.height;
	this.max = Math.max.apply(Math, this.values.map(function(v) {
		return v[0];
	}));
	
	this.X = Math.min(30, (width-this.padding.left-this.padding.right) / values.length);
	this.Y = (height-this.padding.top-this.padding.bottom) / this.max;
	
	var i;
	for(i = 0; i < this.values.length; i++) {
    	var value = this.values[i][0];
    	var h = this.Y*value;
    	var w = this.X;
    	var y = height-h-this.padding.bottom;
    	var x = this.padding.left + i*w;
    	this.colors[i] = this.colorGenerator(value/this.max);
    	
    	/*
if(this.columns[i] == null){
    		var x1 = this.padding.left + w*i;
    		var y2 = height-this.padding.bottom;
	    	this.columns[i] = this.canvas.rect(x1, y2, w, 0, 1).attr({"stroke-width": 1, "stroke": "#000"});
    	}
*/
    	
    	if(i >= this.minIndex && i <= this.maxIndex){
	    	this.columns[i].animate({width: w, height: h, x: x, y: y, fill: this.colors[i], "fill-opacity": 1}, 1000, "<>");
	    } else {
		    this.columns[i].animate({width: w, height: h, x: x, y: y, fill: "#000", "fill-opacity": .5}, 1000, "<>");
	    }
    }
    
    /*
var y = height-this.padding.bottom;
    var removeSet = this.canvas.set();
    for(var ii = i; ii < this.columns.length; ii++){ //Simplify this
	    removeSet.push(this.columns[ii]);
    }

    var removeFromCanvas = function(){
    	for(var ii = i+1; ii < this.columns.length; ii++){
	    	this.columns[ii].remove();
    	}
    	this.columns.removeN(i, this.columns.length-i);
    	this.remakeBlanket();
    	this.remakeSliders();
    };
    removeFromCanvas = _.bind(removeFromCanvas, this);
    if(sizeDiff < 0){
	    this.remakeBlanket();
	    this.remakeSliders();
    } else if (sizeDiff > 0){
	    removeSet.animate({y: y, height: 0, fill: "#000", "fill-opacity": .5}, 1000, "<>", removeFromCanvas);
	}
*/
};

BarsWithSlidersController.prototype.makeBlanket = function(){
	this.blanket.remove();
	this.blanket = this.canvas.set();
	var height = this.canvas.height;
	_.each(this.columns, function(column){
		var bbox = column.getBBox();
		this.blanket.push(this.canvas.rect(bbox.x, this.padding.top, bbox.width, height-this.padding.top-this.padding.bottom).attr({stroke: "none", fill: "#FFF", opacity: 0}));
	}, this);
	
	var controller = this;
    this.blanket.hover(function(){
    	var x = this.getBBox().x + this.getBBox().width/2;
	    controller.updatePopup(x);
	    controller.showPopUp();
    }, function(){
	    controller.hidePopUp();
    });
    this.popup.toFront();
    this.label.toFront();
    this.blanket.toFront();
}

BarsWithSlidersController.prototype.makeSliders = function(){
	if(this.scale != null) this.scale.remove();
	if(this.leftslider != null) this.leftslider.remove();
	if(this.rightslider != null) this.rightslider.remove();

	var height = this.canvas.height;
	var width = this.canvas.width;
	var controller = this;
	var minx = this.padding.left,
		maxx = Math.min(this.values.length*this.X + this.padding.left, width - this.padding.right),
		sh = height - this.padding.bottom;
	this.scale = this.canvas.path("M" + minx + "," + sh + "L" + maxx + "," + sh).attr({stroke: "#000", "stroke-opacity": 1, "stroke-width": 2});    
	
	var leftslider = this.canvas.rect((this.padding.left+this.minIndex*this.X), sh, this.sliderSize, this.sliderSize).attr({stroke: "#000", fill: "#FFF", "stroke-opacity": 1, "stroke-width":1});
	leftslider.transform("t" + (-this.sliderSize/2) + "," + (-this.sliderSize/2));
	this.leftslider = leftslider;
	
	var x = this.values.length < this.maxIndex ? maxx : this.padding.left+this.maxIndex*this.X + this.X;
	var rightslider = this.canvas.rect(x, sh, this.sliderSize, this.sliderSize).attr({stroke: "#000", fill: "#FFF", "stroke-opacity": 1, "stroke-width":1});
	rightslider.transform("t" + (-this.sliderSize/2) + "," + (-this.sliderSize/2));
	this.rightslider = rightslider;
    
    var hoverOn = function(){
    	controller.updatePopup(this.attr("x"), this.attr("y"));
    	controller.showPopUp();
	}, hoverOff = function(){
    	if(this.dragging == null || this.dragging == false) {
	    	controller.hidePopUp();
    	}
	}, lStartDrag = function(){
    	this.dragging = true;
    	this.ox = this.attr("x");
    	
    	controller.updatePopup(this.attr("x"), this.attr("y"));
    	controller.showPopUp();
    }, rStartDrag = function(){
    	this.dragging = true;
    	this.ox = this.attr("x");
    	
    	controller.updatePopup(this.attr("x"), this.attr("y"));
    	controller.showPopUp();
    }, lDragger = function(dx, dy){
    	var x = this.ox+dx;
    	var rx = controller.rightslider.attr("x");
    	var width = this.getBBox().width;

    	if(x < minx) x = minx;
	    if(x+width > rx) x = rx-width;

	    this.attr({x: x});
	    controller.updatePopup(this.attr("x"), this.attr("y"));
    }, rDragger = function(dx, dy){
    	var x = this.ox+dx;
    	var lx = controller.leftslider.attr("x");
    	var width = this.getBBox().width;

    	if(x > maxx) x = maxx;
	    if(x < lx+width) x = lx+width;

	    this.attr({x: x});
	    controller.updatePopup(this.attr("x"), this.attr("y"));
    }, lEndDrag = function(){
    	this.dragging = false;
	    controller.hidePopUp();
	    
	    controller.minIndex = controller.updatePopup(this.attr("x"), this.attr("y"));
	    this.animate({x: controller.columns[controller.minIndex].attr("x")}, 200, ">");
	    controller.minFilterCallback(controller.values[controller.minIndex][1]);
	    this.dragging = false;
    }, rEndDrag = function(){
	    controller.hidePopUp();
	    
	    controller.maxIndex = controller.updatePopup(this.attr("x"), this.attr("y"));
	    this.animate({x: controller.columns[controller.maxIndex].attr("x")+controller.X}, 200, ">");
	    controller.maxFilterCallback(controller.values[controller.maxIndex][1]);
	    this.dragging = false;
    };
    
    this.leftslider.drag(lDragger, lStartDrag, lEndDrag);
    this.rightslider.drag(rDragger, rStartDrag, rEndDrag);
    this.leftslider.hover(hoverOn, hoverOff);
	this.rightslider.hover(hoverOn, hoverOff);
}

BarsWithSlidersController.prototype.updatePopup = function(x){
	var x1, minx = this.padding.left, maxx = this.canvas.width-this.padding.right,
		y1 = this.canvas.height/2-17.5;
	if(x-60 < minx-5) x1 = minx-5;
	else if(x+55 > maxx) x1 = maxx-115;
	else x1 = x-60;
	
	this.popup.transform("t" + x1 + "," + y1);
	this.label.transform("t" + x1 + "," + y1);
	
	
	var i;
	for(i = 0; i < this.columns.length-1; i++){
		var current = this.columns[i];
    	var next = this.columns[i+1];
	    if(x < this.columns[0].attr("x") || (x >= current.attr("x") && x < next.attr("x"))){
	    	break;
	    }
	}
	
	this.label[0].attr({text: this.label1Generator != null ? this.label1Generator(this.values[i][0]) : this.values[i][0], stroke: this.colors[i]});
	this.label[1].attr({text: this.label2Generator != null ? this.label2Generator(this.values[i][1]) : this.values[i][1]});
	
	return i;
};
	
BarsWithSlidersController.prototype.showPopUp = function(){
	this.popup.show();
	this.label.show();
};

BarsWithSlidersController.prototype.hidePopUp = function(){
	this.popup.hide();
	this.label.hide();
};