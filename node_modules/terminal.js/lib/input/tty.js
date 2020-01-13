"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function TtyInput(target, buffer, opts) {
	TtyInput.super_.apply(this, arguments);
	var self = this;
	if(this.target.stdout)
		this.target = this.target.stdout;
	this.target.on("readable", function() {
		self.doread();
	});
}
inherits(TtyInput, require("./base"));
module.exports = TtyInput;

var APP_KEYPAD_PATTERN = /\x1b\[([0-9;]*[ABCD])/g;
TtyInput.prototype.doread = function() {
	var data = this.target.read().toString();
	if(this.appKeypad)
		data = data.replace(APP_KEYPAD_PATTERN, "\x1bO$1");

	this.push(data);
};

TtyInput.canHandle = function(target) {
	if(target.stdin)
		target = target.stdin;
	return typeof target === "object" && "read" in target && "on" in target && target.isTTY;
};
