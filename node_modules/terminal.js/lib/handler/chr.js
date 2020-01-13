"use strict";

// function(cmd, chunk);
/**
* handlers for command characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var chr = {
	/**
	* BELL
	*/
	"\x07": function(cmd, chunk) { // BELL
		this.emit("bell");
	},
	/**
	* BACKSPACE
	*/
	"\x08": function(cmd, chunk) { // BACKSPACE
		this.state.mvCursor(-1, 0);
	},
	/**
	* TAB
	*/
	"\x09": function(cmd, chunk) { // TAB
		this.state.mvTab(1);
	},
	/**
	* DELETE
	*/
	"\x7f": function(cmd, chunk) { // DELETE
		this.state.removeChar(1);
	},
	/**
	* TABSET
	*/
	"\x88": function(cmd, chunk) { // TABSET
		this.state.setTab();
	},
	/**
	* SO
	*/
	"\x0e": function() { // SO
		this.state.mapCharset("G1");
	},
	/**
	* SI
	*/
	"\x0f": function() { // SI
		this.state.mapCharset("G0");
	},

	/**
	* ESCAPE
	*/
	"\x1b": function(cmd, chunk) {
		return chunk[1] !== undefined ?
			this.callHandler("esc", chunk[1], chunk) :
			0;
	},
	/**
	* CARRIAGE RETURN
	*/
	"\r": function(cmd, chunk) {
		this.state.setCursor(0, null);
	}
};
module.exports = chr;
