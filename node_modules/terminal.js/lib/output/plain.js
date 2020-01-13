"use strict";

var inherits = require("util").inherits;
var myUtil = require("../util");

function PlainOutput(state, opts) {
	PlainOutput.super_.apply(this, arguments);
}
inherits(PlainOutput, require("./base.js"));
module.exports = PlainOutput;

PlainOutput.prototype.toString = function() {
	var lines = "";
	var locateCursor = this._opts.locateCursor;

	if(locateCursor)
		lines += myUtil.repeat(" ", this.state.cursor.x+1) + "v\n";

	for(var i = 0; i < this.state.rows; i++) {
		var line = this.state.getLine(i);
		if(locateCursor) {
			lines += i === this.state.cursor.y ? ">" : " ";
		}
		lines += line.str + "\n";
	}
	if(locateCursor)
		lines += myUtil.repeat(" ", this.state.cursor.x+1) + "^\n";

	return lines;
};

PlainOutput.canHandle = function(target) {
	return target === "plain";
};
