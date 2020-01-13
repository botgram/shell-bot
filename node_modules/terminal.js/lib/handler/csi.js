"use strict";

// function(cmd, n, m, args, mod);
/**
* csi command handlers
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var csi = {
	/**
	* CSI Ps @ <br>
	* Insert Ps (Blank) Character(s) (default = 1) (ICH)
	*/
	"@": function(cmd, n, m, args, mod) {
		this.state.insertBlank(n || 1);
	},

	/**
	* CSI Ps A <br>
	* Cursor Up Ps Times (default = 1) (CUU)
	*/
	"A": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, -(n || 1));
	},

	/**
	* CSI Ps B <br>
	* Cursor Down Ps Times (default = 1) (CUD)
	*/
	"B": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, n || 1);
	},

	/**
	* CSI Ps C <br>
	* Cursor Forward Ps Times (default = 1) (CUF)
	*/
	"C": function(cmd, n, m, args, mod) {
		this.state.mvCursor(n || 1, 0);
	},

	/**
	* CSI Ps D <br>
	* Cursor backward Ps Times (default = 1) (CUB)
	*/
	"D": function(cmd, n, m, args, mod) {
		this.state.mvCursor(-(n || 1), 0);
	},

	/**
	* CSI Ps E <br>
	* Cursor down Ps Rows, to column 1 (default = 1) (CNL , NEL)
	*/
	"E": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, n || 1).setCursor(0, null);
	},

	/**
	* CSI Ps F <br>
	* Cursor Preceding Line PS Times (default = 1) (CPL)
	*/
	"F": function(cmd, n, m, args, mod) {
		// (vt52 compatibility mode - Use special graphics character set? )
		this.state.mvCursor(0, -n || 1).setCursor(0, null);
	},

	/**
	* CSI Ps G <br>
	* Cursor Character Absolute  [column] (default = [row,1]) (CHA)
	*/
	"G": function(cmd, n, m, args, mod) {
		//vt52 compatibility mode - Use normal US/UK character set )
		this.state.setCursor((n || 1) - 1);
	},

	/**
	* CSI Ps ; Ps H <br>
	* Cursor Position [row;column] (default = [1,1]) (CUP)
	*/
	"H": function(cmd, n, m, args, mod) {
		this.state.setCursor((m || 1) - 1, (n || 1) - 1);
	},

	/**
	* CSI Ps I <br>
	* Cursor Forward Tabulation Ps tab stops (default = 1) (CHT)
	*/
	"I": function(cmd, n, m, args, mod) {
		this.state.mvTab(n || 1);
	},

	/**
	* CSI Ps J <br>
	* Erase in Display (default = 0) (ED)
	* <ul>
	* <li>J  - erase from cursor to end of display</li>
	* <li>0J - erase from cursor to end of display</li>
	* <li>1J - erase from start to cursor</li>
	* <li>2J - erase whole display</li>
	* </ul>
	*/
	"J": function(cmd, n, m, args, mod) {
		this.state.eraseInDisplay(n || 0);
	},

	/**
	* CSI Ps K <br>
	* Erase in Line (default = 0) (EL)
	* <ul>
	* <li>K  - erase from cursor to end of line</li>
	* <li>0K - erase from cursor to end of line</li>
	* <li>1K - erase from start of line to cursor</li>
	* <li>2K - erase whole line</li>
	* </ul>
	*/
	"K": function(cmd, n, m, args, mod) {
		this.state.eraseInLine(n || 0);
	},

	/**
	* CSI Ps L <br>
	* Insert Ps Line(s) (default = 1) (IL)
	*/
	"L": function(cmd, n, m, args, mod) {
		this.state.insertLine(n || 1);
	},

	/**
	* CSI Ps M <br>
	* Delete Ps Line(s) (default = 1) (DL)
	*/
	"M": function(cmd, n, m, args, mod) {
		this.state.removeLine(n || 1);
	},

	/**
	* CSI Ps P <br>
	* Delete Ps Character(s) (default = 1) (DCH)
	*/
	"P": function(cmd, n, m, args, mod) {
		this.state.removeChar(n || 1);
	},

	/**
	* CSI Pl ; Pc R <br>
	* Report cursor pAosition (CPR)<br>
	* <ul>
	* <li>Pl indicates what line the cursor is on</li>
	* <li>Pr indicated what row the cursor is on</li>
	* </ul>
	* @todo implement
	*/
	"R": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps S <br>
	* Scroll up Ps lines (default = 1) (SU)
	*/
	"S": function(cmd, n, m, args, mod) {
		this.state.scroll(n || 1);
	},

	/**
	* CSI Ps T <br>
	* Scroll down Ps lines (default = 1) (SD) <br>
	* CSI Ps ; Ps ; Ps ; Ps ; Ps T <br>
	* Initiate highlight mouse tracking <br>
	* CSI > Ps; Ps T <br>
	* @todo handle ">" mode
	*/
	"T": function(cmd, n, m, args, mod) {
		if(args.length <= 1)
			this.state.scroll(-n || -1);
	},

	/**
	* CSI Ps X <br>
	* Erase Ps Character(s) (default = 1) (ECH)
	*/
	"X": function(cmd, n, m, args, mod) {
		this.state.eraseCharacters(n || 1);
	},

	/**
	* CSI Ps Z <br>
	* Cursor Backward Tabulation Ps tab stops (default = 1) (CBT)
	*/
	"Z": function(cmd, n, m, args, mod) {
		this.state.mvTab(-(n || 1));
	},

	/**
	* CSI Ps a <br>
	* Move cursor right the indicated # of columns (default = 1) (HPR)
	*/
	"a": function(cmd, n, m, args, mod) {
		this.state.mvCursor(n || 1, 0);
	},

	/**
	* CSI Ps b <br>
	* Repeat the preceding graphic character Ps times (REP)
	*/
	"b": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI P s c <br>
	* Send Device Attributes (Primary DA) <br>
	* CSI > P s c <br>
	* Send Device Attributes (Secondary DA) <br>
	*/
	"c": function(cmd, n, m, args, mod) {
		// TODO
		this.emit("request", "\x1b>0;95;c");
	},

	/**
	* CSI Pm d <br>
	* Line Position Absolute  [row] (default = [1,column]) (VPA)
	*/
	"d": function(cmd, n, m, args, mod) {
		this.state.setCursor(null, (n || 1) - 1);
	},

	/**
	* CSI Pm e <br>
	* Vertical position relative.
	* Move cursor down the indicated # of rows (default = 1) (VPR)
	*/
	"e": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, n || 1);
	},

	/**
	* CSI Ps ; Ps f <br>
	* Horizontal and Vertical Position [row;column] (default =  [1,1]) (HVP)
	*/
	"f": function(cmd, n, m, args, mod) {
		this.state.setCursor((m || 1) - 1, (n || 1) - 1);
	},

	/**
	* CSI Ps g <br>
	* Tab Clear (default = 0) (TBC)
	*/
	"g": function(cmd, n, m, args, mod) {
		// 0g = clear tab stop at the current position
		// 3g = delete all tab stops
		// TODO
		this.state.tabClear(n || 0);
	},

	/**
	* CSI Pm h <br>
	* Set Mode (SM) <br>
	* CSI ? Pm h - mouse escape codes, cursor escape codes <br>
	*/
	"h": function(cmd, n, m, args, mod) {
		var i;

		for(i = 0; i < args.length; i++)
			this.callHandler("mode", mod+args[i], true);
	},

	/**
	* CSI Pm i  Media Copy (MC) <br>
	* CSI ? Pm i <br>
	*/
	"i": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Pm l  Reset Mode (RM) <br>
	* CSI ? Pm l <br>
	*/
	"l": function(cmd, n, m, args, mod) {
		var i;

		for(i = 0; i < args.length; i++)
			this.callHandler("mode", mod+args[i], false);
	},

	/**
	* CSI Pm m <br>
	* Character Attributes (SGR) <br>
	* CSI > Ps; Ps m <br>
	*/
	"m": function(cmd, n, m, args, mod) {
		// Set graphic rendition

		var i;
		if(args[1] === 5 && args[0] === 38)
			this.state.setAttribute("fg", args[2]);
		else if(args[1] === 5 && args[0] === 48)
			this.state.setAttribute("bg", args[2]);
		else {
			for(i = 0; i < args.length; i++)
				this.callHandler("sgr", args[i]);
			if(i === 0)
				this.callHandler("sgr", 0);
		}
	},

	/**
	* CSI Ps n  Device Status Report (DSR) <br>
	* CSI > Ps n <br>
	* <ul>
	* <li>5n - Device Status report</li>
	* <li>0n - Response: terminal is OK</li>
	* <li>3n - Response: terminal is not OK</li>
	* <li>6n - Request cursor position (CPR)</li>
	* </ul>
	* @todo implement
	*/
	"n": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI > Ps p  Set pointer mode <br>
	* CSI ! p   Soft terminal reset (DECSTR) <br>
	* CSI Ps$ p <br>
	*   Request ANSI mode (DECRQM) <br>
	* CSI ? Ps$ p <br>
	* Request DEC private mode (DECRQM) <br>
	* CSI Ps ; Ps " p <br>
	*/
	"p": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps q <br>
	* Load LEDs (DECLL) <br>
	* CSI Ps SP q <br>
	* CSI Ps " q <br>
	* <ul>
	* <li>0q - turn off all four leds</li>
	* <li>1q - turn on Led #1</li>
	* <li>2q - turn on Led #2</li>
	* <li>3q - turn on Led #3</li>
	* <li>4q - turn on Led #4</li>
	* </ul>
	*/
	"q": function(cmd, n, m, args, mod) {
		if(n === 0)
			this.state.resetLeds();
		else
			this.state.ledOn(n-1);
	},

	/**
	* CSI Ps ; Ps r <br>
	* Set Scrolling Region [top;bottom] (default = full size of window)
	* (DECSTBM) <br>
	* CSI ? Pm r <br>
	* CSI Pt; Pl; Pb; Pr; Ps$ r <br>
	*/
	"r": function(cmd, n, m, args, mod) {
		// TODO handle ? prefix, $ ends
		this.state.setScrollRegion((n || 1) -1 , (m || (this.state.rows) ) -1);
	},

	/**
	* CSI ? Pm s <br>
	* Save cursor (ANSI.SYS)
	*/
	"s": function(cmd, n, m, args, mod) {
		this.state.saveCursor();
	},

	/**
	* CSI t <br>
	* unknown
	* @todo implement
	*/
	"t": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps SP u <br>
	* Restore cursor (ANSI.SYS)
	*/
	"u": function(cmd, n, m, args, mod) {
		this.state.restoreCursor();
	},

	/**
	* CSI Pt; Pl; Pb; Pr; Pp; Pt; Pl; Pp$ v <br>
	* (DECCRA)
	* @todo implement
	*/
	"v": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Pt ; Pl ; Pb ; Pr " w <br>
	* (DECEFR)
	* @todo implement
	*/
	"w": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps x  Request Terminal Parameters (DECREQTPARM) <br>
	* CSI Ps x  Select Attribute Change Extent (DECSACE) <br>
	* CSI Pc; Pt; Pl; Pb; Pr$ x <br>
	* @todo implement
	*/
	"x": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* Request Checksum of Rectangular Area
	* DECRQCRA
	* @todo implement
	*/
	"y": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps ; Pu " z <br>
	* CSI Pt; Pl; Pb; Pr$ z <br>
	* (DECELR) / (DECERA)
	* Erase rectangular area
	*/
	"z": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Pm `  Character Position Absolute <br>
	*   [column] (default = [row,1]) (HPA)
	*/
	"`": function(cmd, n, m, args, mod) {
		this.state.setCursor((n || 1) - 1);
	},

	/**
	* CSI Pm " { <br>
	* CSI Pt; Pl; Pb; Pr$ { <br>
	* Selectively erase retangular area (DECSLE) / (DECSERA)
	* @todo implement
	*/
	"{": function(cmd, n, m, args, mod) {
		// TODO
	},


	/**
	* CSI Ps " | <br>
	* Request locator position (DECRQLP)
	* @todo implement
	*/
	"|": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI P m SP } <br>
	* Insert P s Column(s) (default = 1) (DECIC), VT420 and up
	* @todo implement
	*/
	"}": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI P m SP ~ <br>
	* Delete P s Column(s) (default = 1) (DECDC), VT420 and up
	* @todo implement
	*/
	"~": function(cmd, n, m, args, mod) {
		// TODO
	}
};
module.exports = csi;
