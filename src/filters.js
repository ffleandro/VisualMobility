Raphael.fn.drawGrid = function (x, y, w, h, wv, hv, color) {
    color = color || "#000";
    var path = ["M", Math.round(x) + .5, Math.round(y) + .5, "L", Math.round(x + w) + .5, Math.round(y) + .5, Math.round(x + w) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y) + .5],
        rowHeight = h / hv,
        columnWidth = w / wv;
    for (var i = 1; i < hv; i++) {
        path = path.concat(["M", Math.round(x) + .5, Math.round(y + i * rowHeight) + .5, "H", Math.round(x + w) + .5]);
    }
    for (i = 1; i < wv; i++) {
        path = path.concat(["M", Math.round(x + i * columnWidth) + .5, Math.round(y) + .5, "V", Math.round(y + h) + .5]);
    }
    return this.path(path.join(",")).attr({stroke: color, "stroke-opacity": .2});
};

Raphael.fn.drawPlotFilter = function (data, width, height, leftFilterCallback, rightFilterCallback) {
    function getAnchors(p1x, p1y, p2x, p2y, p3x, p3y) {
        var l1 = (p2x - p1x) / 2,
            l2 = (p3x - p2x) / 2,
            a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
            b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
        a = p1y < p2y ? Math.PI - a : a;
        b = p3y < p2y ? Math.PI - b : b;
        var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
            dx1 = l1 * Math.sin(alpha + a),
            dy1 = l1 * Math.cos(alpha + a),
            dx2 = l2 * Math.sin(alpha + b),
            dy2 = l2 * Math.cos(alpha + b);
        return {
            x1: p2x - dx1,
            y1: p2y + dy1,
            x2: p2x + dx2,
            y2: p2y + dy2
        };
    };
    
    //init
    var leftgutter = 10,
        rightgutter = 10,
        bottomgutter = 10,
        topgutter = 20,
        colorhue = .6 || Math.random(),
        color = "hsl(" + [colorhue, .5, .5] + ")",
        r = this,
        txt = {font: '11px Helvetica, Arial', fill: "#CCC"},
        txt1 = {font: '12px Helvetica, Arial', fill: "#FFF"},
        X = (width - leftgutter) / data.length,
        max = Math.max.apply(Math, data.map(function(v) {
		  return v[0];
		}));
        Y = (height - bottomgutter - topgutter) / max,
        
        red = "#FF0000",
        lred = "#AA0000",
        green = "#00CC00",
        lgreen = "#009900";
    
    //Draw slider
    var minx, maxx, sh;
    if(leftFilterCallback || rightFilterCallback){
    	bottomgutter = 20;
    	Y = (height - bottomgutter - topgutter) / max;
    	
	    minx = leftgutter + 10;
	    maxx = width - rightgutter - 10;
	    sh = height - bottomgutter + 12;
	    
	    sliderpath = r.path("M" + minx + "," + sh + "L" + maxx + "," + sh).attr({stroke: color, "stroke-opacity": 1, "stroke-width":2});
    }
    
    if(leftFilterCallback){
	    leftmarker = r.path("M" + minx + "," + topgutter + "L" + minx + "," + sh).attr({stroke: green, "stroke-opacity": 1, "stroke-width":2});
    	leftbutton = r.rect(minx-5, sh-5, 10, 10, 5).attr({stroke: green, fill: lgreen, "stroke-opacity": 1, "stroke-width":2});
    	leftslider = r.set(leftmarker, leftbutton);
    	
    	var startDrag = function(){ 
	    	var bbox = leftslider.getBBox();
	    	this.ox = bbox.x;
	    	this.oy = bbox.y;
	    	this.animate({fill: green}, 200);
	    }, dragger = function(dx, dy){
	    	var x = this.ox+dx;
/* 	     	if(x < minx-10) x = minx-10; */
			
	    	leftslider.transform("t" + x + ",0");
	    }, endDrag = function(){
		    this.animate({fill: lgreen}, 500);
		    var x = this.getBBox().x + 5;
		    var selected = null;
		    
		    for(var i = 0; i < data.length-1; i++){
		    	var prev = data[i][3];
		    	var next = data[i+1][3];
			    if(x >= prev && x <= next){
			    	if(Math.abs(x - prev) < Math.abs(x - next)){
			    		/* leftslider.animate({transform: ") */
			    		leftFilterCallback(data[i][1]);
			    	} else {
				    	leftFilterCallback(data[i+1][1]);
			    	}
			    	return;
			    }
		    }
	    };
	    
	    leftslider.drag(dragger, startDrag, endDrag);
    }
    
    if(rightFilterCallback){
    	rightmarker = r.path("M" + maxx + "," + topgutter + "L" + maxx + "," + sh).attr({stroke: red, "stroke-opacity": 1, "stroke-width":2});
    	rightbutton = r.rect(maxx-5, sh-5, 10, 10, 5).attr({stroke: red, fill: lred, "stroke-opacity": 1, "stroke-width":2});
    	rightslider = r.set(rightmarker, rightbutton);
    	
    	var startDrag = function(){ 
	    	
	    }, dragger = function(dx, dy){
	    	
	    }, endDrag = function(){
		    
	    };
	    
	    rightslider.drag(dragger, startDrag, endDrag);
    }
    
    // Draw
    r.drawGrid(leftgutter + X * .5 + .5, topgutter + .5, width - leftgutter - X, height - topgutter - bottomgutter, 10, 10, "#000");
    var path = r.path().attr({stroke: color, "stroke-width": 4, "stroke-linejoin": "round"}),
        label = r.set(),
        lx = 0, ly = 0,
        is_label_visible = false,
        leave_timer,
        blanket = r.set();
    label.push(r.text(60, 12, "24 km").attr(txt));
    label.push(r.text(60, 27, "22 May 2008").attr(txt1));
    label.hide();
    var frame = r.popup(100, 100, label, "right").attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();

    var p, bgpp;
    for (var i = 0, ii = data.length; i < ii; i++) {
        var y = Math.round(height - bottomgutter - Y * data[i][0]),
            x = Math.round(leftgutter + X * (i + .5));
        if (!i) {
            p = ["M", x, y, "C", x, y];
            bgpp = ["M", leftgutter + X * .5, height - bottomgutter, "L", x, y, "C", x, y];
        }
        if (i && i < ii - 1) {
            var Y0 = Math.round(height - bottomgutter - Y * data[i - 1][0]),
                X0 = Math.round(leftgutter + X * (i - .5)),
                Y2 = Math.round(height - bottomgutter - Y * data[i + 1][0]),
                X2 = Math.round(leftgutter + X * (i + 1.5));
            var a = getAnchors(X0, Y0, x, y, X2, Y2);
            p = p.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
            bgpp = bgpp.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
        }
        
        var dot = r.circle(x, y, 4).attr({fill: "#9FB9DF", stroke: color, "stroke-width": 2});
        blanket.push(r.rect(leftgutter + X * i, 0, X, height-bottomgutter).attr({stroke: "none", fill: "#fff", opacity: 0}));
        var rect = blanket[blanket.length - 1];
        (function (x, y, value, lbl, dot) {
            var timer, i = 0;
            rect.hover(function () {
                clearTimeout(leave_timer);
                var side = "right";
                if (x + frame.getBBox().width > width) {
                    side = "left";
                }
                var ppp = r.popup(x, y, label, side, 1),
                    anim = Raphael.animation({
                        path: ppp.path,
                        transform: ["t", ppp.dx, ppp.dy]
                    }, 200 * is_label_visible);
                lx = label[0].transform()[0][1] + ppp.dx;
                ly = label[0].transform()[0][2] + ppp.dy;
                frame.show().stop().animate(anim);
                label[0].attr({text: value + " km"}).show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
                label[1].attr({text: lbl}).show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
                dot.attr("r", 6);
                is_label_visible = true;
            }, function () {
                dot.attr("r", 4);
                leave_timer = setTimeout(function () {
                    frame.hide();
                    label[0].hide();
                    label[1].hide();
                    is_label_visible = false;
                }, 1);
            });
        })(x, y, data[i][0], data[i][2], dot);
        
        data[i] = [data[i][0], data[i][1], data[i][2], x, y];
    }
    p = p.concat([x, y, x, y]);
    bgpp = bgpp.concat([x, y, x, y, "L", x, height - bottomgutter, "z"]);
    path.attr({path: p});
    frame.toFront();
    label[0].toFront();
    label[1].toFront();
    blanket.toFront();
};

function BarsWithSliderController(values, canvas, colorGenerator, label1Generator, label2Generator, minFilterCallback, maxFilterCallback){
	//variables
	this.values = values;
	this.columns = [];
	this.colors = [];
	this.minIndex = 0;
	this.maxIndex = values.length-1;
	this.popup = null;
	this.label = null;
	this.colorGenerator = colorGenerator;
	this.canvas = canvas;
	this.padding = {top: 0, bottom: 0, left: 0, right: 0};
	this.label1Generator = label1Generator;
	this.label2Generator = label2Generator;
	this.minFilterCallback = minFilterCallback;
	this.maxFilterCallback = maxFilterCallback;
	
	var width = this.canvas.width;
	var height = this.canvas.height;
	
	this.max = Math.max.apply(Math, values.map(function(v) {
		return v[0];
	}));
	
	this.X = width / (values.length+1);
	this.Y = (height-this.X) / this.max;
	this.padding = {top: this.X/2, bottom: this.X/2, left: this.X/2, right: this.X/2};
	
	for(var i = 0; i < values.length; i++) {
		var value = values[i][0];
		var w = this.X;
    	var h = this.Y * value;
    	var x = Math.ceil(this.padding.left + i*this.X);
    	var y = height-h-this.padding.bottom;	
    	this.colors[i] = this.colorGenerator(value/this.max);
	    this.columns[i] = this.canvas.rect(x, y, w, h, 1).attr({"stroke-width": 1, "stroke": "#000", fill: this.colors[i]});
    }
    
    //Draw filter controllers
	var minx = this.padding.left,
		maxx = width - this.padding.right,
		sh = height - this.padding.bottom,
		swidth = this.X;
	    
	var scale = this.canvas.path("M" + minx + "," + sh + "L" + maxx + "," + sh).attr({stroke: "#000", "stroke-opacity": 1, "stroke-width": 2});    
	
	var leftslider = this.canvas.rect(minx-1, sh, swidth, swidth).attr({stroke: "#000", fill: "#FFF", "stroke-opacity": 1, "stroke-width":1});
	leftslider.transform("t" + (-swidth/2) + "," + (-swidth/2));
	this.leftslider = leftslider;
	
	var rightslider = this.canvas.rect(maxx+1, sh, swidth, swidth).attr({stroke: "#000", fill: "#FFF", "stroke-opacity": 1, "stroke-width":1});
	rightslider.transform("t" + (-swidth/2) + "," + (-swidth/2));
	this.rightslider = rightslider;
    
    this.label = this.canvas.set().hide();
    this.popup = this.canvas.rect(0, 0, 100, 35, 5).attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();
/*     filter.popup.transform("t" + (popup.getBBox().width/2*-1) + "," + (filter.popup.getBBox().height*-1));  //Why this no work?*/
	this.label.push(this.canvas.text(50, 10, "").attr({font: '12px Helvetica, Arial', fill: "#FFF"}));
    this.label.push(this.canvas.text(50, 25, "").attr({font: '12px Helvetica, Arial', fill: "#FFF"}));
    
    var controller = this;
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
    	var rx = rightslider.attr("x");

    	if(x < minx) x = minx;
	    if(x+swidth > rx) x = rx-swidth;

	    this.attr({x: x});
	    controller.updatePopup(this.attr("x"), this.attr("y"));
    }, rDragger = function(dx, dy){
    	var x = this.ox+dx;
    	var lx = leftslider.attr("x");

    	if(x > maxx) x = maxx;
	    if(x < lx+swidth) x = lx+swidth;

	    this.attr({x: x});
	    controller.updatePopup(this.attr("x"), this.attr("y"));
    }, lEndDrag = function(){
    	this.dragging = false;
	    controller.hidePopUp();
	    
	    controller.minIndex = controller.updatePopup(this.attr("x"), this.attr("y"));
	    this.animate({x: controller.columns[controller.minIndex].attr("x")}, 200, ">");
	    controller.minFilterCallback(values[controller.minIndex][1]);
	    this.dragging = false;
    }, rEndDrag = function(){
	    controller.hidePopUp();
	    
	    controller.maxIndex = controller.updatePopup(this.attr("x"), this.attr("y"));
	    this.animate({x: controller.columns[controller.maxIndex].attr("x")+controller.X}, 200, ">");
	    controller.maxFilterCallback(values[controller.maxIndex][1]);
	    this.dragging = false;
    };
    
    this.leftslider.drag(lDragger, lStartDrag, lEndDrag);
    this.rightslider.drag(rDragger, rStartDrag, rEndDrag);
    this.leftslider.hover(hoverOn, hoverOff);
	this.rightslider.hover(hoverOn, hoverOff);
}

BarsWithSliderController.prototype.updateValues = function(values){
	this.values = values;
	
	var width = this.canvas.width;
	var height = this.canvas.height;
	this.max = Math.max.apply(Math, this.values.map(function(v) {
		return v[0];
	}));
	
	this.Y = (height-this.X) / this.max;
	
	for(var i = 0; i < this.values.length; i++) {
    	var value = this.values[i][0];
    	var h = this.Y*value;
    	var y = height-h-this.padding.bottom;
    	this.colors[i] = this.colorGenerator(value/this.max);
    	
    	if(i >= this.minIndex && i <= this.maxIndex){
	    	this.columns[i].animate({height: h, y: y, fill: this.colors[i], "fill-opacity": 1}, 1000, "<>");
	    } else {
		    this.columns[i].animate({height: h, y: y, fill: "#000", "fill-opacity": .5}, 1000, "<>");
	    }
    }
};
	
BarsWithSliderController.prototype.updatePopup = function(x, y){
	var x1, minx = this.padding.left, maxx = this.canvas.width-this.padding.right,
		y1 = y-50;
	if(x-50 < minx-5) x1 = minx-5;
	else if(x+50 > maxx) x1 = maxx-100;
	else x1 = x-50;
	
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
	
BarsWithSliderController.prototype.showPopUp = function(){
	this.popup.show();
	this.label.show();
};

BarsWithSliderController.prototype.hidePopUp = function(){
	this.popup.hide();
	this.label.hide();
};

Raphael.fn.drawDoubleBarsFilter = function (data, size, width, height) {
    //init
    var leftgutter = 5,
        rightgutter = 5,
        bottomgutter = 0,
        topgutter = 5,
        r = this,
        txt = {font: '11px Helvetica, Arial', fill: "#FFF"},
        X = Math.ceil((width - leftgutter - rightgutter) / size / 2),
        max1 = 0,
		max2 = 0;
        
    for(key in data){
        max1 = Math.max(max1, data[key][0]);
        max2 = Math.max(max2, data[key][1]);
    }
    Y1 = (height - bottomgutter - topgutter) / max1;
    Y2 = (height - bottomgutter - topgutter) / max2;

    // Draw
    var i = 0;
    for(key in data) {
    	//Draw bar1
    	var value = data[key][0];
    	var h = Y1*value;
    	var x = Math.ceil(leftgutter + i*X);
    	var y = height-h-bottomgutter;
    	
    	var color = "hsl(0.67, .7, 0.5)";
/* 	    console.log("x: " + x + ", y: " + y + ", h: " + h + ", color: " + color); */
	    
    	var bar = r.rect(x, y, X, h, 1).attr({fill: color, "stroke-width": 1, "stroke": "#000"});
    	bar.hover(function(){
	    	
    	}, function(){
	    	
    	});
    	
    	i++;
    	
    	//Draw bar2
    	value = data[key][1];
    	h = Y2*value;
    	x = Math.ceil(leftgutter + i*X);
    	y = height-h-bottomgutter;	
    	
    	color = "hsl(0, 0.9, 0.6)";
/*     	console.log("x: " + x + ", y: " + y + ", h: " + h + ", color: " + color); */
	    
    	bar = r.rect(x, y, X, h, 1).attr({fill: color, "stroke-width": 1, "stroke": "#000"});
    	bar.hover(function(){
	    	
    	}, function(){
	    	
    	});
    	
    	i++;
    }
};