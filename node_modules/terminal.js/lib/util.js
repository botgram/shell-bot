"use strict";

var A = Array.prototype;

exports.extend = function(o){
	for(var i = 1; i < arguments.length; i++)
		for(var key in arguments[i])
			o[key] = arguments[i][key];
	return o;
};

exports.repeat = function(str, n) {
	var i, result = "";
	for(i = 0; i < n; i++) {
		result += str;
	}
	return result;
};

exports.objSplice = function(obj, length, start, end, replace) {
	var splice = A.splice, args = [ start, end ];
	A.push.apply(args, replace);
	obj.length = length;
	splice.apply(obj, args);
	delete obj.length;
};

exports.indexOf = A.indexOf ?
	function() {
		var args = A.slice.call(arguments);
		return A.indexOf.apply(args.shift(), args);
	} :
	function(obj, needle) {
		for (var i = 0; i < this.length; i++)
			if (this[i] === needle) return i;
		return -1;
	};

