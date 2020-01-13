"use strict";

var myUtil = require("../util.js");

function BaseOutput(state) {
	var opts = arguments[Math.max(1, arguments.length - 1)];
	this.state = state;
	this._opts = myUtil.extend({}, this._defOpts, opts);
}
module.exports = BaseOutput;

BaseOutput.prototype.toString = function() {
	throw new Error("toString is not implemented!");
};
