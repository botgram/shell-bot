"use strict";

var myUtil = require("../util.js");

function BaseSource(writer, source) {
	var opts = arguments[Math.max(1, arguments.length - 1)];
	this.writer = writer;
	this.source = source;
	this._opts = myUtil.extend({}, this._defOpts, opts);
}
module.exports = BaseSource;
