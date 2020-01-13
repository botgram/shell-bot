"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;
var AnsiOutput = require("./ansi.js");

function TtyOutput(state, writer, target, opts) {
	this.ansi = new AnsiOutput(state, opts);
	if(target.stdout)
		target = target.stdout;
	target.write("\x1b[3J\x1b[H\x1b[?25l");
	TtyOutput.super_.call(this, state, writer, target, opts);
	this._opts.adhesiveCursor = true;
}
inherits(TtyOutput, require("./live_base.js"));
module.exports = TtyOutput;

TtyOutput.prototype.removeLine = function(number, view) {
	this.target.write("\x1b["+(number+1)+";1H\x1b[M");
	return null;
};
TtyOutput.prototype.changeLine = function(number, view, line, cursor) {
	this.target.write("\x1b["+(number+1)+";1H" +
		this.ansi._renderLine(line, cursor));
	return null;
};
TtyOutput.prototype.insertLine = function(number, view, line, cursor) {
	this.target.write("\x1b["+(number+1)+";1H\x1b[L");
	this.changeLine.apply(this, arguments);
	return null;
};
TtyOutput.prototype.changeLed = function(l1, l2, l3, l4) {

};
TtyOutput.prototype.setCursor = function(x, y) {
};
TtyOutput.prototype.resize = function(size) {
	// TODO
};
TtyOutput.prototype.commit = function() {

};

TtyOutput.canHandle = function(target) {
	if(target.stdout)
		target = target.stdout;
	return typeof target === "object" && "read" in target && "on" in target && target.isTTY;
};
