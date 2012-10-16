var blueColorScale = [
	"#08519C", //> more than level 5
	"#3182BD", //< level 5
	"#6BAED6", //< level 4
	"#9ECAE1", //< level 3
	"#C6DBEF", //< level 2
	"#EFF3FF", //< level 1
];

var hotColdColorScale = [
	"#FF3300", //> more than level 5
	"#FFCC00", //< level 5
	"#FFFF00", //< level 4
	"#00CC00", //< level 3
	"#99FFCC", //< level 2
	"#00CCCC", //< level 1
];

var redColorScale = [
	["#D41D24", 0.8, 30],
	["#EF770D", 0.7, 20],
	["#F2D40B", 0.6, 10],
	["#DFF20B", 0.5, 5],
	["#9AF20B", 0.4, 3],
	["#47F00A", 0.3, 1]
];

var hslToRgb = function(hslColor){
    var r, g, b;
    var h=hslColor[0], s=hslColor[1], l=hslColor[2];

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    r = Math.round(r*255).toString(16);
    r = r.length == 1 ? "0"+r : r;
    g = Math.round(g*255).toString(16);
    g = g.length == 1 ? "0"+g : g;
    b = Math.round(b*255).toString(16);
    b = b.length == 1 ? "0"+b : b;

    return "#" + r + g + b;
}

var transportColors = {}; //Map in HSL color values
transportColors['Walk'] = [0.37, 1, 0.25];
transportColors['Metro'] = [0.67, 1, 0.4];
transportColors['Run'] = [0.33, 1, 0.40];
transportColors['Train'] = [0.76, .9, 0.8];
transportColors['Car'] = [0, .9, .6];
transportColors['Bus'] = [.16, 1, .6];
transportColors['Motorcycle'] = [.6, .7, .5];
transportColors['Boat'] = [0.07, .9, .4];
transportColors['Bicycle'] = [.1, 1, .6];
transportColors['Unknown'] = [0, 0, 0];

var genHeatColor = function(hue){ /* value between 0 and 1 */
    return genHeatColor(hue, 0.8, 0.5);
};
var genHeatColor = function(hue, sat, lgh){
    return "hsl(" + [hue*.36, sat, lgh] + ")";
};