function keyval () {
	"use strict";

	var _head, _tail, _pos;
	var _keys = {};
	this.len = 0;

	this.set = function (k, v) {
		if (! _keys[k]) {
			var node = {v: v};
			
			if (this.len === 0) {
				_head = _tail = node;
				this.rwd();
			} else {
				node.p = _tail;
				_tail.n = node;
				_tail = node;
			}
			_keys[k] = node;
			
			this.len++;
		}
	};

	this.del = function (k) {
		var v;
		var node = _keys[k];
		
		if (node) {
			v = node.v;

			if (node.p) node.p.n = node.n;
			if (node.n) node.n.p = node.p;
			
			_keys[k] = null;
			this.len--;
		}
		
		return v;
	};

	this.get = function (k) {
		return _keys[k];
	};

	this.itr = function () {
		return _pos = _pos.n;
	};

	this.rwd = function () {
		_pos = {n: _head};
	}

	this.empty = function () {
		_keys = {};
		_head = _tail = _pos = null;
		this.len = 0;
	};
}
