"use strict";

function attr(name, value) {
	return function() {
		this.state.setAttribute(name, value);
	};
}
/**
* handlers for SGR escape characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var sgr = {
	0: function(cmd) {
		this.state.resetAttribute();
	},
	1: attr("bold", true), // Bold
	2: function(cmd) {}, // Weight:feint
	3: attr("italic", true), // Italic
	4: attr("underline", true), // Underline
	5: "6", // Slowly Blinking
	6: attr("blink", true), //Rapidly Blinking
	7: attr("inverse", true), // Inverse
	8: function(cmd) {}, // Hidden
	9: function(cmd) {}, // Strike Through
	20: function(cmd) {}, // Style:fraktur
	21: function(cmd) {}, // Double Underlined
	22: attr("bold", false),
	23: attr("italic", false),
	24: attr("underline", false),
	25: attr("blink", false),
	27: attr("inverse", false),

	30: "37", 31: "37", 32: "37", 33: "37", 34: "37", 35: "37", 36: "37",
	37: function(cmd) {
		this.state.setAttribute("fg", (+cmd) - 30);
	},

	38: function(cmd) {
		// TODO 255 color support
	},
	39: function(cmd) {
		this.state.resetAttribute("fg");
	},

	40: "47", 41: "47", 42: "47", 43: "47", 44: "47", 45: "47", 46: "47",
	47: function(cmd) {
		this.state.setAttribute("bg", (+cmd) - 40);
	},
	48: function(cmd) {
		// TODO 255 color support
	},
	49: function(cmd) {
		this.state.resetAttribute("bg");
	},

	51: function(cmd) { // Frame:box
		
	},

	52: function(cmd) { // Frame:circle
		
	},

	53: function(cmd) { // Overlined
		
	},

	90: "97", 91: "97", 92: "97", 93: "97", 94: "97", 95: "97", 96: "97",
	97: function(cmd) {
		this.state.setAttribute("fg", (+cmd) - 90 + 8);
	},
	100: "107", 101: "107", 102: "107", 103: "107", 104: "107", 105: "107", 106: "107",
	107: function(cmd) {
		this.state.setAttribute("bg", (+cmd) - 100 + 8);
	}
};
module.exports = sgr;
