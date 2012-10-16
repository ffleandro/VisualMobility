#VisualMobility

Visual Exploration Tool for Personal Analysis

![Screenshot](https://raw.github.com/ffleandro/VisualMobility/master/examples/screenshot.png)


##About
_VisualMobility is a **visual exploration** tool for **multi-modal personal mobility information** that provides a **flexible filtering interface** and **contextual visualizations** that try to extract meaningful **mobility patterns**._

As part of my Masters' Thesis I developed this prototype. This was my first real experience with HTML5, CSS and JavaScript so of course there are lots of code optimizations to be done. This project was just the tip of the iceberg for personal mobility exploration tools and I hope to add future developments for more flexibility and integration with other tools and data sources.

Check out the live demo here:
[http://visualmobility.tk](http://visualmobility.tk) (Chrome only)

##Examples
![Screenshot](https://raw.github.com/ffleandro/VisualMobility/master/examples/heatmap.png)
![Screenshot](https://raw.github.com/ffleandro/VisualMobility/master/examples/scatter_time.png)
![Screenshot](https://raw.github.com/ffleandro/VisualMobility/master/examples/scatter_date.png)

##Dependencies
 * [Backbone](http://backbonejs.org/)
 * [Underscore](http://underscorejs.org/)
 * [D3](http://d3js.org)
 * [NVD3](http://nvd3.com/)
 * [Leaflet](http://leaflet.cloudmade.com/)
 * [Heatmap.js](https://github.com/pa7/heatmap.js)
 * [CartoDB](http://cartodb.com/)
 * [RaphaelJS](http://raphaeljs.com/)
 * [JQuery](http://jquery.com/)

##Future Work

 * [Crossfilter](http://square.github.com/crossfilter/) integration
 * [Torque](https://github.com/CartoDB/torque) integration
 * Remove [RaphaelJS](http://raphaeljs.com/) dependency on the Sidepanel. Change to [D3](http://d3js.org)+[Crossfilter](http://square.github.com/crossfilter/)
 * Better Data Collection tools
 * More visualizations
 * More server side processing algorithms
 * Authentication integration with [CartoDB](http://cartodb.com/)
 * Extend Server API to support filter and settings management
 * Support for Safari and Firefox
 * UI and code Optimization
