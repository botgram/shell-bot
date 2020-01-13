"use strict";

var stream = require("stream");
var util = require("util");
var myUtil = require("../util.js");

function BaseInput(target, buffer) {
	BaseInput.super_.apply(this, arguments);

	var opts = arguments[Math.max(1, arguments.length - 1)];
	this.target = target;
	this.buffer = buffer;
	this._appKeypad = false;
	var self = this;
	this._opts = myUtil.extend({}, this._defOpts, opts);
}
util.inherits(BaseInput, stream.Readable);

BaseInput.prototype.getKey = function(key) {
	var rv = this.buffer.getMode("appKeypad") ? "\x1bO" : "\x1b[";
	switch(key) {
	case "up":
		rv += "A";
		break;
	case "down":
		rv += "B";
		break;
	case "right":
		rv += "C";
		break;
	case "left":
		rv += "D";
		break;
	}
	return rv;
};

BaseInput.prototype._read = function() {

};

module.exports = BaseInput;
