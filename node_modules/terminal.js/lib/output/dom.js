"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;
var HtmlOutput = require("./html.js");

function DomOutput(state, writer, target, opts) {
	this.html = new HtmlOutput(state, opts);
	target.innerHTML = "<div style='visibility:hidden;'></div>";
	this.spacer = target.firstChild;
	this.cursorView = null;
	DomOutput.super_.apply(this, arguments);
	this._opts.adhesiveCursor = true;
}
inherits(DomOutput, require("./live_base.js"));
module.exports = DomOutput;

DomOutput.prototype.createView = function() {
	var e = this.target.ownerDocument.createElement("div");
	e.style.overflow = "hidden";
	return e;
};

DomOutput.prototype.removeLine = function(number, view) {
	return this.target.removeChild(view);
};

DomOutput.prototype.changeLine = function(number, view, line, cursor) {
	view.innerHTML = this.html._renderLine(line, cursor);
};

DomOutput.prototype.insertLine = function(number, view, line, cursor) {
	view.innerHTML = this.html._renderLine(line, cursor);
	this.target.insertBefore(view, this.target.childNodes[number]);
	return view;
};

DomOutput.prototype.changeLed = function(l1, l2, l3, l4) {

};

DomOutput.prototype.setCursor = function(x, y) {
};

DomOutput.prototype.resize = function(size) {
	this.target.lastChild.innerHTML = this.html._genColumnsString();
};

DomOutput.prototype.commit = function() {
	var i;

	var diff = this.state.rows - this.state.getBufferRowCount();
	var html = myUtil.repeat("<br />", diff) +
	"<div style='line-height:0'>" + myUtil.repeat("&nbsp;", this.state.columns) + "</div>";

	this.spacer.innerHTML = html;
	this.spacer.lineHeight = diff === 0 ? "0" : "inherit";
};

DomOutput.canHandle = function(target) {
	// Test if target is some kind of DOM-Element
	return target !== null && typeof target === "object" && "ownerDocument" in target;
};
