"use strict";

var myUtil = require("./util.js");
var inherits = require("util").inherits;

/**
* map of graphical character aliases
* @enum
* @private
*/
var graphics = {
        "`": "\u25C6",
        "a": "\u2592",
        "b": "\u2409",
        "c": "\u240C",
        "d": "\u240D",
        "e": "\u240A",
        "f": "\u00B0",
        "g": "\u00B1",
        "h": "\u2424",
        "i": "\u240B",
        "j": "\u2518",
        "k": "\u2510",
        "l": "\u250C",
        "m": "\u2514",
        "n": "\u253C",
        "o": "\u23BA",
        "p": "\u23BB",
        "q": "\u2500",
        "r": "\u23BC",
        "s": "\u23BD",
        "t": "\u251C",
        "u": "\u2524",
        "v": "\u2534",
        "w": "\u252C",
        "x": "\u2502",
        "y": "\u2264",
        "z": "\u2265",
        "{": "\u03C0",
        "|": "\u2260",
        "}": "\u00A3",
        "~": "\u00B7"
};

/**
* Creates setter for a specific property used on attributes, modes, and meta
* properties.
*
* If the object defines a property _fooUsed, copy on write is enabled. This
* makes sure that the object is is copied before any changes are made.
* This makes it possible to reference the object from other context without
* copying it every time. This reduces memory consumption in some cases.
*
* @private
*/
function setterFor(objName) {
	return function(name, value) {
		if(this["_"+objName+"sUsed"] === true) {
			this["_"+objName+"s"] = myUtil.extend({}, this["_"+objName+"s"]);
			this["_"+objName+"sUsed"] = false;
		}
		var obj = this["_"+objName+"s"];

		if(!(name in obj))
			throw new Error("Unknown "+objName+" `"+name+"`");
		this.emit(objName+"change", name, value, obj[name]);
		obj[name] = value;
	};
}

/**
* A class which holds the terminals state and content
* @param {object} options - object to configure the terminal
* @param {number} [options.columns=80] - number of columns in the terminal
* @param {number} [options.rows=24] - number of rows in the terminal
* @param {object} [options.attributes] - initial attributes of the terminal
* @param {string} [options.attributes.fg=null] initial foreground color
* @param {string} [options.attributes.bg=null] initial background color
* @param {boolean} [options.attributes.bold=false] terminal is bold by default
* @param {boolean} [options.attributes.underline=false] terminal is underlined by default
* @param {boolean} [options.attributes.italic=false] terminal is italic by default
* @param {boolean} [options.attributes.blink=false] terminal blinks by default
* @param {boolean} [options.attributes.inverse=false] terminal has reverse colors by default
* @constructor
*/
function TermState(options) {
	TermState.super_.call(this, {
		decodeStrings: false
	});
	options = myUtil.extend({
		attributes: {},
	}, options);
	this._defaultAttr = myUtil.extend({
		fg: null,
		bg: null,
		bold: false,
		underline: false,
		italic: false,
		blink: false,
		inverse: false
	}, options.attributes);

	// This is used for copy on write.
	this._attributesUsed = true;

	this.rows = ~~options.rows || 24;
	this.columns = ~~options.columns || 80;

	this
		.on("newListener", this._newListener)
		.on("removeListener", this._removeListener)
		.on("pipe", this._pipe);
	// Reset all on first use
	this.reset();
}
inherits(TermState, require("stream").Writable);
module.exports = TermState;

/**
* emits resize on the reader of this class
* @param {ReadableStream} a Readable Stream
* @private
*/
TermState.prototype._pipe = function(src) {
	var onresize = src.emit.bind(src, "resize");
	this.on("resize", onresize)
		.on("unpipe", function(src) {
			src.removeListener("resize", onresize);
		});
};

/**
* tells a new listener the terminals state when it is registered
* @param {string} ev - event name
* @param {function} cb - the listening function
* @private
*/
TermState.prototype._newListener = function(ev, cb) {
	var i;
	switch(ev) {
		case "lineinsert":
			for(i = 0; i < this.getBufferRowCount(); i++)
				cb.call(this, i, this.getLine(i));
			break;
		case "resize":
			cb.call(this, { columns: this.columns, rows: this.rows });
			break;
		case "cursormove":
			cb.call(this, this.cursor.x, this.cursor.y);
			break;
	}
};

/**
* cleans up listener when it is removed from the terminal state
* @param {string} ev - event name
* @param {function} cb - the listening function
* @private
*/
TermState.prototype._removeListener = function(ev, cb) {
	var i;
	if(ev === "lineremove") {
		for(i = 0; i < this.getBufferRowCount(); i++)
			cb.call(this, 0, this.getLine(i));
	}
};

/**
* resets the terminals state.
*/
TermState.prototype.reset = function() {
	if(this._buffer)
		this._removeLine(0, this.getBufferRowCount());
	this._buffer = this._defBuffer = {
		str: [], attr: []
	};
	this._altBuffer = {
		str: [], attr: []
	};
	this._scrollback = {
		str: [], attr: []
	};
	this._modes = {
		cursor: true,
		cursorBlink: false,
		appKeypad: false,
		wrap: true,
		insert: false,
		crlf: false,
		mousebtn: false,
		mousemtn: false,
		mousesgr: false,
		reverse: false,
		graphic: false
	};
	this._charsets = {
		"G0": "unicode",
		"G1": "unicode",
		"G2": "unicode",
		"G3": "unicode"
	};
	this._mappedCharset = "G0";
	this._mappedCharsetNext = "G0";
	this._metas = {
		title: "",
		icon: ""
	};
	this.resetAttribute();
	this.cursor = {x:0,y:0};
	this._savedCursor = {x:0,y:0};
	this._scrollRegion = [0, this.rows-1];
	this.resetLeds();
	this._tabs = [];
};

/**
* creates a new line in the buffer
* @param [line] - build line upon this value
* @private
*/
TermState.prototype._createLine = function(line) {
	if(line === undefined || typeof line !== "object") {
		line = line ? line.toString() : "";
		line = { str: line, attr: {0: this._defaultAttr} };
	}
	else if(!line || typeof line.str !== "string" || typeof line.attr !== "object")
		throw new Error("line objects must contain attr and str" + line);

	for(var i in line.attr) {
		if(isNaN(i))
			continue;
		if(i > line.str.length || line.attr[i] === undefined)
			delete line.attr[i];
	}
	return line;
};

/**
* Takes a chunk of data and puts it in the buffer
* @alias TermState.prototype.write
* @see http://nodejs.org/docs/latest/api/stream.html#stream_writable_write_chunk_encoding_callback
*/
TermState.prototype._write = function(chunk, encoding, callback) {
	var i, j, line;
	var lines = chunk.split("\n");
	var wrapped = false;
	var c = this.cursor;

	for(i = 0; i < lines.length; i++) {
		wrapped = false;
		// Handle long lines
		if(lines[i].length > this.columns - c.x) {
			if(c.x >= this.columns)
				c.x = this.columns - 1;
			if(this._modes.wrap) {
				lines.splice(i, 1,
					lines[i].substr(0, this.columns - c.x),
					lines[i].substr(this.columns - c.x)
				);
				wrapped = true;
			}
			else {
				lines[i] = lines[i].substr(0, this.columns - c.x - 1) +
					lines[i].substr(-1);
			}
		}

		// write line
		this._lineInject(lines[i], wrapped);

		if(i + 1 !== lines.length) {
			c.y++;
			if(this._modes.crlf || wrapped)
				c.x = 0;

			if(c.y > this._scrollRegion[1]) {
				c.y--;
				this._removeLine(this._scrollRegion[0]);
				this._insertLine(this._scrollRegion[1]);
			}
		}
	}
	this.setCursor();
	return callback();
};

/**
* invokes the specified charset (G0, G1, G2, G3) for use,
* either permanently or only on the next character
*/
TermState.prototype.mapCharset = function(target, nextOnly) {
	this._mappedCharset = target;
	if (!nextOnly) this._mappedCharsetNext = target;
	this._modes.graphic = this._charsets[this._mappedCharset] === "graphics"; // backwards compatibility
};

/**
* designates (populates) the specified charset (G0, G1, G2, G3) graphics.
* only "graphics" and "unicode" supported
*/
TermState.prototype.selectCharset = function(charset, target) {
	if (!target) target = this._mappedCharset;
	this._charsets[target] = charset;
	this._modes.graphic = this._charsets[this._mappedCharset] === "graphics"; // backwards compatibility
};

/**
* converts graphics from ascii to utf8 characters when the
* active character set has graphics selected
* @private
*/
TermState.prototype._graphConvert = function(content) {
	// optimization for 99% of the time
	if(this._mappedCharset === this._mappedCharsetNext && !this._modes.graphic) {
		return content;
	}

	var result = "", i;
	for(i = 0; i < content.length; i++) {
		result += (this._modes.graphic && content[i] in graphics) ?
			graphics[content[i]] :
			content[i];
		this._mappedCharset = this._mappedCharsetNext;
		this._modes.graphic = this._charsets[this._mappedCharset] === "graphics"; // backwards compatibility
	}
	return result;
};

/**
* injects a single line into the buffer.
* @see _write
* @private
*/
TermState.prototype._lineInject = function(content, wrapped) {
	var c = this.cursor;
	var line = this.getLine();
	var args;
	if(this._modes.insert) {
		args = new Array(content.length);
		args.unshift(line.attr, line.str.length+1, c.x, 0);
		myUtil.objSplice.apply(0, args);
		line.str = line.str.substr(0, c.x) + myUtil.repeat(" ",c.x - line.str.length) +
			this._graphConvert(content) + line.str.substr(c.x);
		line.str = line.str.substr(0, this.columns);
	}
	else {
		line.str = line.str.substr(0, c.x) +
			myUtil.repeat(" ", c.x - line.str.length) +
			this._graphConvert(content) + line.str.substr(c.x + content.length);
	}

	this._applyAttributes(line, c.x, content.length);
	if(wrapped)
		line.attr.wrapped = true;
	this.setLine(c.y, line);

	c.x += content.length;
};

/**
* removes characters at cursor position.
* @params {number} count - number of characters to be removed
*/
TermState.prototype.removeChar = function(count) {
	var c = this.cursor, line = this.getLine(c.y);
	var last = line.attr[line.str.length];
	myUtil.objSplice(line.attr, line.str.length+1, c.x, count);
	line.str = line.str.substr(0, c.x) + line.str.substr(c.x+count);
	line.attr[line.str.length] = last;
	this.setLine(c.y, line);
};

/**
* inserts whitespaces at cursor position
* @params {number} count - number of whitespaces to be inserted
*/
TermState.prototype.insertBlank = function(count) {
	var c = this.cursor, line = this.getLine(c.y);
	var last = line.attr[line.str.length];
	// TODO: unify this into one objSplice call.
	myUtil.objSplice(line.attr, line.str.length+1, c.x, 0, new Array(count));
	myUtil.objSplice(line.attr, line.str.length+1, this.columns);
	line.str = line.str.substr(0, c.x) +
		myUtil.repeat(" ", count) + line.str.substr(c.x);
	line.str = line.str.substr(0, this.columns);
	line.attr[line.str.length] = last;
	this.setLine(c.y, line);
};

/**
* removes lines at cursor position.
* @params {number} count - number of lines to be removed
*/
TermState.prototype.removeLine = function(count) {
	this._removeLine(this.cursor.y, +count);
	if(this._scrollRegion[1] !== this.rows-1 && this.cursor.y <= this._scrollRegion[1])
		this._insertLine(this._scrollRegion[1] + 1 - count, +count);
};

/**
* removes lines at given position
* @params {number} line - line number to start removing
* @params {number} count - number of lines to be removed
* @private
*/
TermState.prototype._removeLine = function(line, count) {
	var i, str, attr;
	if(count === undefined)
		count = 1;
	str = this._buffer.str.splice(line, count);
	this._scrollback.str.push.call(this._scrollback, str);
	attr = this._buffer.attr.splice(line, count);
	this._scrollback.attr.push.call(this._scrollback, attr);
	for(i = 0; i < str.length; i++)
		this.emit("lineremove", line, {str: str[i], attr: attr[i] });
	return count;
};

/**
* sets the line to a value and emits "linechanged" event
* @params {number} nbr - line number to set
* @params {object} line - line content to set
*/
TermState.prototype.setLine = function(nbr, line) {
	if(typeof nbr === "object" && line === undefined) {
		line = nbr;
		nbr = this.cursor.y;
	}
	line = this._createLine(line);
	if(this._buffer.str.length <= nbr) {
		this._insertLine(nbr, line);
	}
	else {
		if(line.str.length > this.columns)
			line.attr[this.columns] = line.attr[line.str.length];
		this._buffer.str[nbr] = line.str.substr(0, this.columns);
		this._buffer.attr[nbr] = line.attr;
		this.emit("linechange", nbr, line);
	}
};

/**
* inserts lines at cursor position
* @params {number} count - number of lines to insert
*/
TermState.prototype.insertLine = function(count) {
	this._insertLine(this.cursor.y, +count);
};

/**
* inserts lines at given position
* @params {number} line - line number to start inserting
* @params {number} count - number of lines to be inserted
* @private
*/
TermState.prototype._insertLine = function(nbr, line) {
	var h = this.getBufferRowCount();
	var start = Math.min(h, nbr);
	var end = nbr + 1;
	var i;
	if(typeof line === "number") {
		end = nbr + line;
		line = undefined;
	}

	for(i = start; i < end; i++) {
		if(this.rows === this.getBufferRowCount())
			this._removeLine(this._scrollRegion[1], 1);
		line = this._createLine(line);
		this._buffer.str.splice(start, 0, line.str);
		this._buffer.attr.splice(start, 0, line.attr);
		this.emit("lineinsert", start, line);
		line = undefined;
	}
};

/**
* TODO
* @private
*/
TermState.prototype._applyAttributes = function(line, index, len) {
	var li, last, pre, pi, i;

	for(li = index+len; li > 0 && line.attr[li] === undefined; li--);
	last = line.attr[li];

	for(pi = index-1; pi > 0 && line.attr[pi] === undefined; pi--);
	pre = line.attr[pi];

	for(i = index; i < index+len; i++)
		delete line.attr[i];

	if(pre !== this._attributes || index === line.str.length)
		line.attr[index] = this._attributes;
	if(index + len <= this.columns)
		line.attr[index + len] = last;

	this._attributesUsed = true;
	return this;
};

/**
* sets cursor to a specific position
* @param {number} x - column of cursor starting at 0
* @param {number} y - row of cursor starting at 0
*/
TermState.prototype.setCursor = function(x, y) {
	var c = this.cursor, line;

	if(typeof x !== "number")
		x = c.x;
	if(typeof y !== "number")
		y = c.y;

	if(x < 0)
		x = 0;
	else if(x > this.columns)
		x = this.columns;

	if(y < 0)
		y = 0;
	else if(y >= this.rows)
		y = this.rows - 1;

	if(c.x !== x || c.y !== y || arguments.length === 0) {
		c.x = x;
		c.y = y;

		this.emit("cursormove", x, y);
	}

	return this;
};

/**
* resizes terminal to a specific dimension
* @param {object} size - new size of the terminal
*/
TermState.prototype.resize = function(size) {
	var c = this.cursor;

	// Total number of lines e need to remove in order to resize the terminal
	var totalLinesToRemove = Math.max(0, this.rows - size.rows);
	// Number of blank lines from the cursor to the bottom edge of the window
	var blankLines = this.rows - c.y - 1;
	// The number of lines we will remove from the bottom part of the terminal
	var removeFromBottom = Math.min(totalLinesToRemove, blankLines);
	// The number of lines we will remove from the top part of the terminal
	var removeFromTop = totalLinesToRemove - removeFromBottom;

	// Remove bottom lines
	this._removeLine(this.rows - removeFromBottom, removeFromBottom);

	// Remove top lines
	this._removeLine(0, removeFromTop);

	this.rows = ~~size.rows;
	this.columns = ~~size.columns;

	this.redraw();

	this.setScrollRegion(0, this.rows-1);

	this.emit("resize", {rows: this.rows, columns: this.columns});

	this.setCursor();
	return this;
};

TermState.prototype.redraw = function(){
	for(var i = 0; i < this._buffer.str.length; i++)
		this.setLine(i, this.getLine(i));
};

/**
* moves cursor relative
* @param {number} x - relative horizontal movement
* @param {number} y - relative vertical movement
*/
TermState.prototype.mvCursor = function(x, y) {
	if(x || y)
		this.setCursor(this.cursor.x + x, this.cursor.y + y);
	return this;
};

/**
* scrolls the scroll area of a buffer
* @param {number} scroll - number of lines to be scrolled (positive: up; negative: down)
*/
TermState.prototype.scroll = function(scroll) {
	var i;
	var count = Math.min(Math.abs(scroll), this._scrollRegion[1] - this._scrollRegion[0]);

	if(scroll > 0) {
		this._removeLine(this._scrollRegion[0], count);
		for(i = 0; i < count; i++) {
			this._insertLine(this._scrollRegion[1] +1  - count);
		}
	}
	else {
		this._removeLine(this._scrollRegion[1] +1 -count, count);
		for(i = 0; i < count; i++) {
			this._insertLine(this._scrollRegion[0]);
		}
	}
};

/**
* returns plain text representation of the buffer
*/
TermState.prototype.toString = function() {
	return this._buffer.str.join("\n");
};

/**
* moves cursor to previous line or scrolls up if at top
*/
TermState.prototype.prevLine = function() {
		if(this.cursor.y === this._scrollRegion[0])
			this.scroll(-1);
		else
			this.mvCursor(0, -1);
		return this;
};

/**
* moves cursor to next line or scrolls down if at bottom
*/
TermState.prototype.nextLine = function() {
		if(this.cursor.y === this._scrollRegion[1])
			this.scroll(1);
		else
			this.mvCursor(0, 1);
		return this;
};

/**
* resets the attributes
*/
TermState.prototype.resetAttribute = function(name) {
	if(name)
		this.setAttribute(name, this._defaultAttr[name]);
	else {
		this._attributesUsed = true;
		this._attributes = this._defaultAttr;
	}
	return this;
};

/**
* saves cursor position
*/
TermState.prototype.saveCursor = function() {
	this._savedCursor.x = this.cursor.x;
	this._savedCursor.y = this.cursor.y;
	return this;
};

/**
* restore previously saved cursor position
*/
TermState.prototype.restoreCursor = function() {
	return this.setCursor(this._savedCursor.x, this._savedCursor.y);
};

/**
* truncate characters from buffer at cursor position.
* @param {number} count number of characters to truncate
*/
TermState.prototype.eraseCharacters = function(count) {
	var c = this.cursor, line = this.getLine(c.y);

	line.str = line.str.substr(0, c.x) + myUtil.repeat(" ", count) +
		line.str.substr(c.x + count);
	line.str = line.str.substr(0, this.columns);
	this._applyAttributes(line, c.x, count);
	this.setLine(c.y, line);
};

/**
* cleans lines
* @param n can be one of the following:
* <ul>
* 	<li>0 or "after": cleans below and after cursor</li>
* 	<li>1 or "before": cleans above and before cursor</li>
* 	<li>2 or "all": cleans entire screen</li>
* </ul>
*/
TermState.prototype.eraseInDisplay = function(n) {
	var c = this.cursor, i, line, self = this;
	var chLine = function() {
		line = self._createLine();
		self._applyAttributes(line, 0, self.columns);
		self.setLine(i, line);
	};
	switch(n || 0) {
		case "below":
		case "after":
		case 0:
			n = 0;
			for(i = c.y+1; i < this.rows; i++)
				chLine();
			break;
		case "above":
		case "before":
		case 1:
			n = 1;
			for(i = 0; i < c.y-1; i++)
				chLine();
			break;
		case "all":
		case 2:
			for(i = 0; i < this.rows; i++)
				chLine();
			return this;
	}
	return this.eraseInLine(n);
};

/**
* cleans one line
* @param n can be one of the following:
* <ul>
* 	<li>0 or "after": cleans from the cursor to the end of the line</li>
* 	<li>1 or "before": cleans from the start of the line to the cursor</li>
* 	<li>2 or "all": cleans entire screen</li>
* </ul>
*/
TermState.prototype.eraseInLine = function(n) {
	var c = this.cursor;
	var line = this.getLine();
	switch(n || 0) {
		case "after":
		case 0:
			line.str = line.str.substr(0, c.x);
			this._applyAttributes(line, c.x, this.columns);
			break;
		case "before":
		case 1:
			line.str = myUtil.repeat(" ",c.x) + line.str.substr(c.x);
			this._applyAttributes(line, 0, c.x);
			break;
		case "all":
		case 2:
			line = this._createLine();
			break;
	}
	this.setLine(c.y, line);
	return this;
};

/**
* sets scroll region
*/
TermState.prototype.setScrollRegion = function(n, m) {
	this._scrollRegion[0] = +n;
	this._scrollRegion[1] = +m;
	return this;
};

/**
* switches between default and alternative buffer
* @param alt {boolean} true for switch to alternative buffer, false for default
* buffer
*/
TermState.prototype.switchBuffer = function(alt) {
	var i;
	var active, inactive;
	if(alt) {
		active = this._altBuffer;
		inactive = this._defBuffer;
	}
	else {
		active = this._defBuffer;
		inactive = this._altBuffer;
	}
	if(active === this._buffer)
		return;

	for(i = active.str.length; i < inactive.str.length; i++)
		this.emit("lineremove", active.str.length, this.getLine(i));

	this._buffer = active;

	for(i = 0; i < active.str.length && i < inactive.str.length; i++)
		this.emit("linechange", active.str.length, this.getLine(i));

	for(; i < active.str.length; i++)
		this.emit("lineinsert", i, this.getLine(i));
	return this;
};

/**
* enables a LED
* @param led {number} LED 0 - 3
*/
TermState.prototype.ledOn = function(led) {
	this.setLed(led, true);
	return this;
};

/**
* enables a LED
* @param led {number} LED 0 - 3
* @param value {boolean} sets LED to value
*/
TermState.prototype.setLed = function(led, value) {
	if (led < this._leds.length) { // we only have 4 leds (0,1,2,3)
		this._leds[led] = !!value;
		this.emit("ledchange", Array.apply(null, this._leds));
	}
	return this;
};

/**
* disables all LEDs
*/
TermState.prototype.resetLeds = function() {
	this._leds = [!!0,!!0,!!0,!!0];
	this.emit("ledchange", Array.apply(null, this._leds));
	return this;
};

/**
* gets the internal buffer row count. Will be lesser equal than actual number of
* rows
*/
TermState.prototype.getBufferRowCount = function() {
	return this._buffer.str.length;
};

/**
* gets the current value of an LED
* @param led {number} LED 0 - 3
* @returns true if LED is enabled, false otherwise
*/
TermState.prototype.getLed = function(n) {
	return this._leds[n];
};

/**
* gets the line definition
* @param n {number} - line number starting at 0
* @returns line definition
*/
TermState.prototype.getLine = function(n) {
	if(n === undefined)
		n = this.cursor.y;

	if(this._buffer.str[n] !== undefined)
		return {
			str: this._buffer.str[n],
			attr: this._buffer.attr[n]
		};
	else
		return this._createLine();
};

/**
* returns the current value of a given mode
* @param n {string} - mode
*/
TermState.prototype.getMode = function(n) {
	return this._modes[n];
};


/**
* moves Cursor forward or backward a specified amount of tabs
* @param n {number} - number of tabs to move. <0 moves backward, >0 moves
* forward
*/
TermState.prototype.mvTab = function(n) {
	var x = this.cursor.x;
	var tabMax = this._tabs[this._tabs.length - 1] || 0;
	var positive = n > 0;
	n = Math.abs(n);
	while(n !== 0 && x > 0 && x < this.columns-1) {
		x += positive ? 1 : -1;
		if(~myUtil.indexOf(this._tabs, x) || (x > tabMax && x % 8 === 0))
			n--;
	}
	this.setCursor(x);
};

/**
* set tab at specified position
* @param pos {number} - position to set a tab at
*/
TermState.prototype.setTab = function(pos) {
	// Set the default to current cursor if no tab position is specified
	if(pos === undefined) {
		pos = this.cursor.x;
	}
	// Only add the tab position if it is not there already
	if (~myUtil.indexOf(this._tabs, pos)) {
		this._tabs.push(pos);
		this._tabs.sort();
	}
};

/**
* remove a tab
* @param pos {number} - position to remove a tab. Do nothing if the tab isn't
* set at this position
*/
TermState.prototype.removeTab = function(pos) {
	var i, tabs = this._tabs;
	for(i = 0; i < tabs.length && tabs[i] !== pos; i++);
	tabs.splice(i, 1);
};

/**
* removes a tab at a given index
* @params n {number} - can be one of the following
* <ul>
* 	<li>"current" or 0: searches tab at current position. no tab is at current
* 	position delete the next tab</li>
* 	<li>"all" or 3: deletes all tabs</li>
*/
TermState.prototype.tabClear = function(n) {
	switch(n || "current") {
		case "current":
		case 0:
			for(var i = this._tabs.length - 1; i >= 0; i--) {
				if(this._tabs[i] < this.cursor.x) {
					this._tabs.splice(i, 1);
					break;
				}
			}
			break;
		case "all":
		case 3:
			this._tabs = [];
			break;
	}
};

/**
* sets a given Attribute
*/
TermState.prototype.setAttribute = setterFor("attribute");
/**
* sets a given Mode
*/
TermState.prototype.setMode = setterFor("mode");
/**
* sets a given Meta date
*/
TermState.prototype.setMeta = setterFor("meta");
