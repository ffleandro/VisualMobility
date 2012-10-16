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

Raphael.fn.drawBarChartFilter = function (data, width, height, toggleCallback) {
    //init
    var leftgutter = 5,
        rightgutter = 5,
        bottomgutter = 0,
        topgutter = 10,
        r = this,
        txt = {font: '11px Helvetica, Arial', fill: "#FFF"},
        X = (width - leftgutter - rightgutter) / data.length,
        max = Math.max.apply(Math, data.map(function(v) {
		  return v[0];
		}));
        Y = (height - bottomgutter - topgutter) / max;
        
    // Draw
    var padding = 3;
    var w = X-padding*2;
    for (var i = 0, ii = data.length; i < ii; i++) {
    	var value = data[i][0];
    	var h = Y*value;
    	var x = leftgutter + padding + i*X;
    	var y = height-h-bottomgutter;	
    	var color = genHeatColor(value/max, 0.8, 0.5);
    	var darkerColor = genHeatColor(value/max, 0.8, 0.3);
    	console.log("value: " + value + "W: " + w + " H: " + h + " X: " + x + " Y: " + y + " hue: " + color);
    	var bar = r.rect(x, y, w, h, 1).attr({fill: color, "stroke": darkerColor, "stroke-width": 1});
    	bar.hover(function(){
	    	
    	}, function(){
	    	
    	});
    }
};