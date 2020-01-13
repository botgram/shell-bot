"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;
function genCall(name) {
	return function() {
		if(typeof this.source[name] === "function")
			return this.source[name].apply(this.source, arguments);
		else {
			Array.prototype.unshift.call(arguments, name);
			return this.source.emit.apply(this.source, arguments);
		}
	};
}

function EmitterSource(writer, source, opts) {
	EmitterSource.super_.apply(this, arguments);

	this._register();
}
inherits(EmitterSource, require("./base"));
module.exports = EmitterSource;

EmitterSource.prototype._register = function() {
	var self = this;
	var writer = this.writer;

	this.source
		.on("data", function(data) {
			writer.write(data);
		})
		.on("exit", function() {
			writer.end();
		});
};


EmitterSource.prototype.write = genCall("write");
EmitterSource.prototype.end = genCall("end");
EmitterSource.prototype._resize = genCall("resize");
EmitterSource.prototype.kill = genCall("kill");
EmitterSource.prototype.resize = function(size) {
	return this._resize(size);
};

EmitterSource.canHandle = function(source) {
	return source && typeof source.addListener === "function" &&
		typeof source.on === "function";
};
