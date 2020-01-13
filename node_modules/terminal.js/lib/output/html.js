"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function HtmlOutput(state, opts) {
	HtmlOutput.super_.apply(this, arguments);
}
inherits(HtmlOutput, require("./base"));
module.exports = HtmlOutput;

HtmlOutput.prototype._defOpts = {
	cssClass: false,
	cursorBg: "#00ff00",
	cursorFg: "#ffffff",
};

// Taken from https://github.com/dtinth/headles-terminal/blob/master/vendor/term.js#L226
HtmlOutput.prototype.colors = [
	// dark:
	"#2e3436",
	"#cc0000",
	"#4e9a06",
	"#c4a000",
	"#3465a4",
	"#75507b",
	"#06989a",
	"#d3d7cf",
	// bright:
	"#555753",
	"#ef2929",
	"#8ae234",
	"#fce94f",
	"#729fcf",
	"#ad7fa8",
	"#34e2e2",
	"#eeeeec"
];

// Taken from https://github.com/chjj/tty.js/blob/master/static/term.js#L250
// Colors 16-255
// Thanks to TooTallNate for writing this.
HtmlOutput.prototype.colors = (function() {
	var colors = HtmlOutput.prototype.colors,
		r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff], i;

	function hex(c) {
		c = c.toString(16);
		return c.length < 2 ? "0" + c : c;
	}

	function out(r, g, b) {
		colors.push("#" + hex(r) + hex(g) + hex(b));
	}

	// 16-231
	i = 0;
	for (; i < 216; i++) {
		out(r[(i / 36) % 6 | 0], r[(i / 6) % 6 | 0], r[i % 6]);
	}

	// 232-255 (grey)
	i = 0;
	for (; i < 24; i++) {
		r = 8 + i * 10;
		out(r, r, r);
	}

	return colors;
})();

HtmlOutput.prototype._cssPrefix = function(css) {
	return css + "-webkit-" + css + "-moz-" + css + "-ms-" + css;
};

HtmlOutput.prototype._mkCssProperties = function(attr) {
	var css = "";

	if(!attr)
		return "";

	if(attr.fg)
		css += (attr.inverse ? "background" : "color") + ":" + this.colors[attr.fg] + ";";
	if(attr.bg)
		css += (attr.inverse ? "color" : "background") + ":" + this.colors[attr.bg] + ";";
	if(attr.bold)
		css += "font-weight:bold;";
	if(attr.italic)
		css += "font-style:italic;";
	if(attr.underline || attr.blink)
		css += "text-decoration:" + (attr.underline ? "underline " : "") + (attr.blink ? "blink;" : ";");
	if(attr.doublewidth || attr.doubleheight) {
		css += this._cssPrefix("transform:" + (attr.doublewidth ? "scaleX(2) " : "") +
				(attr.doubleheight ? "scaleY(2);" : ";"));
		css += this._cssPrefix("transform-origin:left " + (attr.doubleheight || "") + ";");
	}

	return css;
};

var PATTERN_LT = /</g;
var PATTERN_GT = />/g;
var PATTERN_SPACE = / /g;
HtmlOutput.prototype.escapeHtml = function(str) {
	return str.replace(PATTERN_LT, "&lt;").
			replace(PATTERN_GT, "&gt;").
			replace(PATTERN_SPACE, "&nbsp;");
};

HtmlOutput.prototype._mkAttr = function(attr, type, e) {
	if(this._opts.cssClass) {
		var classes = type || "";
		var keys = Object.keys(attr);
		for(var i = 0; i < keys.length; i++) {
			if(attr[keys[i]] === true)
				classes += " " + keys[i];
			else if(attr[keys[i]] !== false && attr[keys[i]] !== null)
				classes += " " + keys[i] + "_" + attr[keys[i]];
		}
		return "class='" + classes + "'";
	}

	var css = this._mkCssProperties(attr);

	switch(type) {
	case "cursor":
		css += "background:" + this._opts.cursorBg + ";";
		css += "color:" + this._opts.cursorFg + ";";
		break;
	case "line":
		css += "overflow:hidden;white-space:nowrap;";
		break;
	}

	if(css === "")
		return "";

	if(e)
		e.setAttribute("style", css);
	return "style='" + css + "'";
};

HtmlOutput.prototype._renderLine = function(line, cursor) {
	var i, start;
	var html = "", attr, css = "", htmlAttr, content;
	var str = line.str;

	if(line.attr[str.length].bg !== null)
		str += myUtil.repeat(" ", this.state.columns - str.length);
	else if(cursor !== undefined && cursor < this.state.columns)
		str += myUtil.repeat(" ", cursor + 1 - str.length);

	if(str.length === 0)
		return "<br />";
	for(i = 0; i < str.length;) {
		css = "";
		start = i++;
		if(start in line.attr)
			attr = line.attr[start];
		if(cursor !== start)
			while(i < str.length && !(i in line.attr) && cursor !== i)
				i++;

		htmlAttr = this._mkAttr(attr,
				this.state.getMode("cursor") && cursor === start ? "cursor"
				: undefined);
		content = this.escapeHtml(str.substring(start, i));
		if(htmlAttr !== "")
			html += "<span " + htmlAttr + ">" + content + "</span>";
		else
			html += content;
	}
	return "<div "+ this._mkAttr(line.attr, "line") + ">" + html + "</div>";
};

HtmlOutput.prototype.toString = function() {
	var i;

	var lines = "";
	for(i = 0; i < this.state.rows; i++) {
		var line = this.state.getLine(i);
		lines += "<div style='overflow:hidden'>" + this._renderLine(line) + "</div>";
	}
	return lines + "<div style='line-height:0;visibility:hidden;'>" +
		this._genColumnsString() + "</div>";
};

HtmlOutput.prototype._genColumnsString = function() {
	return myUtil.repeat("&nbsp;",this.state.columns);
};

HtmlOutput.canHandle = function(target) {
	return target === "html";
};
