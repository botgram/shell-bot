"use strict";

/**
* esc command handlers
* Currently we ignore all DCS codes
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var esc = {
	/**
	* ESC c<br>
	* Full Reset (RIS)
	*/
	"c": function(cmd, chunk) {
		this.state.reset();
		return 2;
	},

	/**
	* ESC D<br>
	* Index (IND is 0x84)
	* Moves cursor down one line in same column. 
	* If cursor is at bottom margin, screen performs a scroll-up.
	*/
	"D": function(cmd, chunk) {
		this.state.nextLine();
		return 2;
	},

	/**
	* ESC E<br>
	* Next Line (NEL is 0x85)
	* This sequence causes the active position to move to the first position on
	* the next line downward
	* If the active position is at the bottom margin, a scroll up is performed
	*/
	"E": function(cmd, chunk) {
		this.state.nextLine().setCursor(0);
		return 2;
	},

	/**
	* ESC F<br>
	* Start of Selected Area to be sent to auxiliary output device (SSA)
	*/

	/**
	* ESC G<br>
	* End of Selected Area to be sent to auxiliary output device (SSA)
	*/

	/**
	* ESC H<br>
	* Tab Set (HTS is 0x88)
	*/
	"H": function(cmd, chunk) {
		this.state.setTab();
		return 2;
	},

	/**
	* ESC I<br>
	* Horizontal Tab Justify, moves string to next tab position (HTJ)
	*/

	/**
	* ESC J<br>
	* Vertical Tabulation Set at current line (VTS)
	*/

	/**
	* ESC K<br>
	* Partial Line Down (subscript) (PLD)
	*/

	/**
	* ESC L<br>
	* Partial Line Up (superscript) (PLU)
	*/
 
	/**
	* ESC M<br>
	* Reverse Index (RI is 0x8d)
	* Move the active position to the same horizontal position on the preceding line. 
	* If the active position is at the top margin, a scroll down is performed
	*/
	"M": function(cmd, chunk) {
		this.state.prevLine();
		return 2;
	},

	/**
	* ESC N<br>
	* Single Shift Select of G2 Character Set (SS2 is 0x8e). This affects next character only
	*/
	"N": function(cmd, chunk) {
		this.state.mapCharset("G2", true);
		return 2;
	},

	/**
	* ESC O<br>
	* Single Shift Select of G3 Character Set (SS3 is 0x8f). This affects next character only
	*/
	"O": function(cmd, chunk) {
		this.state.mapCharset("G3", true);
		return 2;
	},

	/**
	* ESC P<br>
	* Device Control String (DCS is 0x90)
	* @todo function should return errors if it detects garbaged DCS sequences
	*/
	"P": function(cmd, chunk) {

		var dcs = this.parseDcs(chunk);
		if(dcs === null || dcs.cmd === "")
			return 0;
		else if(dcs.length !== chunk.length && dcs.cmd === "") {
			// TODO Garbaged DCS. report error.
			return 1;
		}

		var result = this.callHandler("dcs", dcs.cmd, +dcs.args[0],
									  +dcs.args[1], dcs.args, dcs.mod);
		return dcs.length;
	},

	/**
	* ESC Q<br>
	* Private Use 1 (PU1)
	*/
	"Q": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC R<br>
	* Private Use 2 (PU2)
	*/
	"R": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC S<br>
	* Set Transmit State (STS)
	*/
	"S": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC T<br>
	* Cancel Character, ignore previous character (CCH)
	* @todo implement
	*/
	"T": function(cmd, chunk) {
		//TODO
		return 2;
	},

	/**
	* ESC U<br>
	* Message Waiting, turns on an indicator on the terminal (MW)
	*/
	"U": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC V<br>
	* Start of Protected Area (SPA)
	*/
	"V": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC W<br>
	* End of Protected Area (EPA)
	*/
	"W": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC X<br>
	* Reserved
	*/
	"X": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC Y<br>
	* Reserved
	*/
	"Y": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC Z<br>
	* DECID Dec Private identification
	* The kernel returns the string ESC [ ? 6 c , claiming it is a VT102
	*/
	"Z": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC n<br>
	* Invoke the G2 Character Set as GL (LS2)
	*/
	"n": function(cmd, chunk) {
		this.state.mapCharset("G2");
		return 2;
	},

	/**
	* ESC o<br>
	* Invoke the G3 Character Set as GL (LS3)
	*/
	"o": function(cmd, chunk) {
		this.state.mapCharset("G3");
		return 2;
	},

	/**
	* ESC 7<br>
	* Save Cursor (DECSC)
	*/
	"7": function(cmd, chunk) {
		this.state.saveCursor();
		return 2;
	},

	/**
	* ESC 8<br>
	* Restore Cursor (DECRC)
	*/
	"8": function(cmd, chunk) {
		this.state.restoreCursor();
		return 2;
	},

	/**
	* ESC |<br>
	* Invoke the G3 Character Set as GR (LS3R)
	*/
	"|": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC [<br>
	* Control sequence introducer (CSI)
	* @todo function should return errors if it detects garbaged CSI sequences
	*/
	"[": function(cmd, chunk) {
		var csi = this.parseCsi(chunk);
		if(csi === null || csi.cmd === "")
			return 0;
		else if(csi.length !== chunk.length && csi.cmd === "") {
			// TODO Garbaged CSI. report error.
			return 1;
		}

		var result = this.callHandler("csi", csi.cmd, +csi.args[0], +csi.args[1], csi.args, csi.mod);
		//if(result === null)
		// TODO Unknown CSI. report error.
		return csi.length;
	},

	/**
	* ESC \<br>
	* 7-bit - File Separator (FS)
	* 8-bit - String Terminator (VT125 exits graphics) (ST)
	*/
	"\\": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC ]<br>
	* 7-bit - Group Separator (GS)
	* 8-bit - Operating System Command (OSC is 0x9d)
	* @todo function should return errors if it detects garbaged OSC sequences
	*/
	"]": function(cmd, chunk) {
		var osc = this.parseOsc(chunk);
		if(osc === null || osc.terminated === false)
			return 0;
		else if(osc.length !== chunk.length && osc.terminated === false) {
			// TODO Garbaged OSC. report error.
			return 1;
		}

		var result = this.callHandler("osc", osc.cmd, osc.args);
		//if(result === null)
		// TODO Unknown OSC. report error.
		return osc.length;
	},

	/**
	* ESC ^<br>
	* Privacy Message (password verification), terminaed by ST 
	* (PM is 0x9e) (PM)
	*/
	"^": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC _<br>
	* Application Program Command (to word processor), term by ST
	* (APC is 0x9f) (APC)
	*/
	"_": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC %<br>
	* Select default/utf-8 character set.
	* @ = default, G = utf-8; 8 (Obsolete)
	*/
	"%": function(cmd, chunk) {
		if(chunk[2] === undefined)
			return 0;
		this.state.selectCharset("unicode");
		return 3;
	},

	/**
	* ESC }<br>
	* Invoke the G2 Character Set as GR (LS2R)
	*/
	"}": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC ~<br>
	* Invoke the G1 Character Set as GR (LS1R)
	*/
	"~": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC ( ) * + - . /<br>
	*/
	"(": "/",
	")": "/",
	"*": "/",
	"+": "/",
	"-": "/",
	".": "/",
	"/": function(cmd, chunk) {
		var targets = { "(": "G0",
				")": "G1", "*": "G2", "+": "G3",
				"-": "G1", ".": "G2", "/": "G3" };
		if(chunk[2] === undefined)
			return 0;
		if(chunk[2] === "%" && chunk[3] === undefined)
			return 0;
		var charset = (chunk[2] === "0") ? "graphics" : "unicode";
		this.state.selectCharset(charset, targets[chunk[1]]);
		return (chunk[2] === "%") ? 4 : 3;
	},

	/**
	* ESC #<br>
	* 3 DEC line height/width
	*/
	"#": function(cmd, chunk) {
		if(chunk[2] === undefined)
			return 0;
		var line = this.state.getLine();
		switch(chunk[2]) {
		case "3":
			line.attr.doubleheight = "top";
			break;
		case "4":
			line.attr.doubleheight = "bottom";
			break;
		case "5":
			delete line.attr.doubleheight;
			delete line.attr.doublewidth;
			break;
		case "6":
			line.attr.doublewidth = true;
			break;
		}
		this.state.setLine(line);
		return 3;
	},

	/**
	* ESC g<br>
	* Visual Bell
	*/
	"g": function(cmd, chunk) {
		this.emit("bell", true);
		return 2;
	},

	/**
	* ESC &lt;<br>
	* The terminal interprets all sequences according to ANSI standards X3.64-1979 and X3.41-1974.
	* The VT52 escape sequences described in this chapter are not recognized.
	* (DECANM)
	*/
	"<": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC &gt;<br>
	* (set numeric keypad mode?)
	* Normal Keypad (DECPNM)
	*/
	">": function(cmd, chunk) {
		this.state.setMode("appKeypad", false);
		return 2;
	},

	/**
	* ESC =<br>
	* Application Keypad (DECPAM)
	* Serial port requested application keyboard
	*/
	"=": function(cmd, chunk) {
		this.state.setMode("appKeypad", true);
		return 2;
	}
};
module.exports = esc;
