function encodeUrl(url){
	var encoded_url = url;
	encoded_url = encoded_url.replace(/#/g, "%23");
	encoded_url = encoded_url.replace(/>/g, "%3E");
	encoded_url = encoded_url.replace(/</g, "%3C");
	encoded_url = encoded_url.replace(/\+/g, "%2B");
/* 	encoded_url = encoded_url.replace(/&/g, "%26"); //careful: sometimes not wanted to escape this char */
	return encoded_url;
}

function decodeUrl(url){
	var decoded_url = url;
	decoded_url = decoded_url.replace(/%23/, "#");
	decoded_url = decoded_url.replace(/%3E/, ">");
	decoded_url = decoded_url.replace(/%3C/, "<");
	decoded_url = decoded_url.replace(/%2B/, "+");
	return decoded_url;
}

/* Implement some sugar syntactic methods */
Array.prototype.remove = function(el){
	this.removeAt(this.indexOf(el));
}

Array.prototype.removeAt = function(index){
	if(index != -1) {
		this.splice(index, 1);
	}
}

Array.prototype.removeN = function(index, howmany){
	if(this.length >= index+howmany) {
		this.splice(index, howmany);
	}
}

Array.prototype.add = function(el){
	if(this.indexOf(el) == -1){
		this.push(el);
	}
}

Array.prototype.contains = function(el){
	return this.indexOf(el) != -1;
}

Array.prototype.toggle = function(el){
	if(this.indexOf(el) == -1){
		this.add(el);
	} else this.remove(el);
}

Backbone.Collection.prototype.clear = function(){
	this.each(function(model) { model.destroy(); });
}
/* End of sugar syntax */