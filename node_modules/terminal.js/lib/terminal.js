"use strict";

var inherits = require("util").inherits;
var myUtil = require("./util");
var TermState = require("./term_state.js");
var DomOutput = require("./output/dom.js");
var DomInput = require("./input/dom.js");

var outputs = {
	plain: require("./output/plain.js"),
	html: require("./output/html.js"),
	ansi: require("./output/ansi.js")
};


var CSI_PATTERN = /^\x1b\[([?!>]?)([0-9;]*)([@A-Za-z`]?)/;
var DCS_PATTERN = /^\x1bP([0-9;@A-Za-z`]*)\x1b\\/;
var OSC_PATTERN = /^\x1b\]([0-9]*);([^\x07]*)(\x07?)/;

/**
* Terminal is the glue between a TerminalState and the escape sequence
* interpreters.
* @constructor
*/
function Terminal(options) {
	Terminal.super_.call(this, { decodeStrings: false });

	this.options = myUtil.extend({
		columns: 80,
		rows: 24,
		attributes: {}
	}, options || {});
	this.rows = ~~this.rows;
	this.columns = ~~this.columns;
	this.state = new TermState(this.options);
	this.oldChunk = null;
	this.on("pipe", this._pipe);
}
inherits(Terminal, require("stream").Writable);
module.exports = Terminal;

Terminal.prototype.handlers = {
	chr: require("./handler/chr.js"),
	esc: require("./handler/esc.js"),
	csi: require("./handler/csi.js"),
	sgr: require("./handler/sgr.js"),
	dcs: require("./handler/dcs.js"),
	mode: require("./handler/mode.js"),
	osc: require("./handler/osc.js"),
};

/**
* emits resize on the reader of this class
* @param {ReadableStream} a Readable Stream
* @private
*/
Terminal.prototype._pipe = function(src) {
	var onresize = function(size) {
		if(typeof src.resize === "function") // assume it"s a pty.js-object
			src.resize(size.columns, size.rows);
		src.emit("resize", size);
	};
	this.on("resize", onresize)
		.on("unpipe", function(src) {
			src.removeListener("resize", onresize);
		});
};

/**
* Takes a chunk of data, interprets its escape sequences, and fills backend state
* @alias Terminal.prototype.write
* @see http://nodejs.org/docs/latest/api/stream.html#stream_writable_write_chunk_encoding_callback
*/
Terminal.prototype._write = function(chunk, encoding, callback) {
	var len = 1;
	if(typeof chunk !== "string")
		chunk = chunk.toString();

	if(this.oldChunk !== null) {
		chunk = this.oldChunk + chunk;
		this.oldChunk = null;
	}

	while(chunk.length > 0 && len > 0) {
		len = this.callHandler("chr", chunk[0], chunk);
		if(len === null) {
			for(len = 1; len < chunk.length &&
				!(chunk[len] in this.handlers.chr); len++);

			this.state.write(chunk.substr(0, len));
		}

		if(len > 0)
			chunk = chunk.slice(len);
	}
	if(chunk.length !== 0)
		this.oldChunk = chunk;
	this.emit("ready");
	callback();
};

/**
* calls an handler
* @param type {string} one of the following types:
* <ul>
* <li>chr: interprets special characters (such as \r or \b)</li>
* <li>esc: interprets simple escape characters starting with \x1b</li>
* <li>csi: interprets CSI escape sequences</li>
* <li>sgr: interprets SGR escape sequences</li>
* <li>dcs: interprets DCS escape sequences</li>
* <li>mode: interprets mode sequences</li>
* <li>osc: interpretes OSC escape sequences</li>
* </ul>
* @param cmd {string} command to execute
* @param ... {...array} passed to the command function
*/
Terminal.prototype.callHandler = function(type, cmd) {
	var args = Array.prototype.slice.call(arguments, 1);
	var result;

	if(!(type in this.handlers && cmd in this.handlers[type]))
		return null;

	if(typeof this.handlers[type][cmd] === "string")
		cmd = this.handlers[type][cmd];

	result = this.handlers[type][cmd].apply(this, args);
	return result === undefined ? 1 : result;
};

/**
* reads a CSI command sequence from a chunk of data
* @param chunk {string} a chunk of data to parse
* @returns {{args: Number|Array, mod: String, cmd: String, length: Number}}
*/
Terminal.prototype.parseCsi = function(chunk) {
	var i;
	var match = CSI_PATTERN.exec(chunk);
	if(match === null)
		return null;
	var args = match[2] === "" ? [] : match[2].split(";");
	for(i = 0; i < args.length; i++)
		args[i] = +args[i];
	return {
		args: args,
		mod: match[1],
		cmd: match[3],
		length: match[0].length
	};
};

/**
* reads a OSC command sequence from a chunk of data
* @param chunk {string} a chunk of data to parse
* @returns {{args: String|Array, mod: String, cmd: String, length: Number,
* terminated: Boolean}}
*/
Terminal.prototype.parseOsc = function(chunk) {
	var match = OSC_PATTERN.exec(chunk);
	if(match === null)
		return null;
	return {
		args: match[2].split(";"),
		cmd: match[1],
		terminated: match[3] === "\x07",
		length: match[0].length
	};
};

/**
* reads a OSC command sequence from a chunk of data
* @param chunk {string} a chunk of data to parse
* @returns {{args: String|Array, mod: String, cmd: String, length: Number}}
*/
Terminal.prototype.parseDcs = function(chunk) {
	var i;
	var match = DCS_PATTERN.exec(chunk);
	if(match === null)
		return null;
	return {
		args: [null,null],
		mod: match[1],
		cmd: match[1],
		length: match[0].length
	};
};

/**
* sets up a DOM element as Terminal in- and output
* @param element a DOM element node
* @param options options field
* @returns a terminal input which can be used to send data to a pty
*/
Terminal.prototype.dom = function(element, opts) {
	var input = new DomInput(element, this.state, opts);
	var output = new DomOutput(this.state, this, element, opts);

	return input;
};

/**
* will give a string representation of the terminal
* @param format one of "html", "ansi", "plain" if not present,
* {@link TermState#toString} will be called.
* @returns string representation of the terminal
*/
Terminal.prototype.toString = function(format) {
	if(typeof format !== "string")
		return this.state.toString.apply(this.state, arguments);

	var output = new outputs[format](this.state);

	return output.toString();
};
