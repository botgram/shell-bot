"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function AnsiOutput(state, opts) {
	AnsiOutput.super_.apply(this, arguments);
}
inherits(AnsiOutput, require("./base.js"));
module.exports = AnsiOutput;

AnsiOutput.prototype._mkSgr = function(attr, extra) {
	var codes = "", cursor = extra && extra.$cursor;

	codes += attr.bold === true ? ";1" : ";22";
	codes += attr.italic === true ? ";3" : ";23";
	codes += attr.underline === true ? ";4" : ";24";
	codes += attr.blink === true ? ";5" : ";25";
	codes += (attr.inverse === true || (cursor && attr.inverse !== true)) ?
		";7" : ";27";

	var fg = attr.fg;
	var bg = attr.bg;

	if (fg) {
		if (fg < 8) codes += ";" + (+fg + 30);
		else if (fg < 16) codes += ";" + (+fg + 90 - 8);
		else codes += ";38;5;"+fg;
	}
	if (bg) {
		if (bg < 7) codes += ";" + (+bg + 30);
		else if (bg < 16) codes += ";" + (+bg + 100 - 8);
		else codes += ";48;5;"+bg;
	}

	return "\x1b["+codes.substr(1)+"m";
};

AnsiOutput.prototype._renderLine = function(line, cursor) {
	var i, start;
	var output = "", attr;
	var str = line.str;

	if(line.attr[str.length].bg !== null)
		str += myUtil.repeat(" ", this.state.colums - str.length);
	else if(cursor !== undefined)
		str += myUtil.repeat(" ", cursor + 1 - str.length);

	for(i = 0; i < str.length;) {
		start = i++;
		if(start in line.attr)
			attr = line.attr[start];
		if(cursor !== start)
			while(i < str.length && !(i in line.attr) && cursor !== i)
				i++;

		output += this._mkSgr(attr, { $cursor: cursor === start}) +
			str.substring(start, i);
	}
	return output;
};

AnsiOutput.prototype.toString = function() {
	var lines = "";
	var c = this.state.cursor;

	for(var i = 0; i < this.state.rows; i++) {
		var line = this.state.getLine(i);
		lines += "\n" + this._renderLine(line, c.y === i ? c.x : null);
	}
	
	return lines.substr(1) + "\x1b[0m";
};

AnsiOutput.canHandle = function(target) {
	return target === "ansi";
};
