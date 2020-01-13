"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function DomInput(target, buffer, opts) {
	DomInput.super_.apply(this, arguments);

	target.tabIndex = 0;
	this._addListener(this.target, "keypress", this._keypress);
	this._addListener(this.target, "keydown", this._keydown);
	this._addListener(this.target, "paste", this._paste);
	this._addListener(this.target, "contextmenu", this._contextmenu);
	this._addListener(this.target, "click", this._click);
	this._addListener(this.target, "mousemove", this._mousemove);
}
inherits(DomInput, require("./base"));
module.exports = DomInput;

DomInput.prototype._addListener = function(elem, name, cb) {
	var self = this;
	var wrap = function(ev) {
		ev = ev || window.event;
		return cb.call(self, ev);
	};
	if(elem.addEventListener)
		elem.addEventListener(name, wrap);
	else
		elem["on"+name] = wrap;
};

DomInput.prototype.getKeyCode = function(ev) {
	if(!ev)
		return;
	else if(ev.charCode)
		return ev.charCode;
	else if(ev.which)
		return ev.which;
	else
		return ev.keyCode;
};
DomInput.prototype._mousemove = function(ev) {

};
DomInput.prototype._click = function(ev) {
	this.target.contentEditable=false;
};
DomInput.prototype._cancelEvent = function(ev) {
	if(ev.stopPropagation) ev.stopPropagation();
		if(ev.preventDefault) ev.preventDefault();
			this.target.contentEditable=false;
	return false;
};
DomInput.prototype._contextmenu = function(ev) {
	var self = this;
	this.target.contentEditable=true;
};
DomInput.prototype._paste = function(ev) {
	this.push(ev.clipboardData.getData("text/plain"));
	return this._cancelEvent(ev);
};

// Taken from tty.js: https://github.com/chjj/tty.js
DomInput.prototype._keypress = function(ev) {
	var key = this.getKeyCode(ev);
	if (!key || ev.ctrlKey || ev.altKey || ev.metaKey) return;

	this.push(String.fromCharCode(key));
	this.target.contentEditable=false;
	return this._cancelEvent(ev);
};

// Taken from tty.js: https://github.com/chjj/tty.js
DomInput.prototype._keydown = function(ev) {
	var key, keyCode = this.getKeyCode(ev);

	if ((ev.ctrlKey && ev.shiftKey) || ev.metaKey) {
		// do not catch ctrl+shift and meta key bindings.
		return;
	}

	switch (keyCode) {
	//backspace
	case 8:
		if (ev.shiftKey) {
			key = "\x08"; //^H
			break;
		}
		key = "\x7f"; //^?
		break;
	//tab
	case 9:
		if (ev.shiftKey) {
			key = "\x1b[Z";
			break;
		}
		key = "\t";
		break;
	//return /enter
	case 13:
		key = "\r";
		break;
	//escape
	case 27:
		key = "\x1b";
		break;
	//left - arrow
	case 37:
		key = this.getKey("left");
		break;
	//right - arrow
	case 39:
		key = this.getKey("right");
		break;
	//up - arrow
	case 38:
		key = this.getKey("up");
		break;
	//down - arrow
	case 40:
		key = this.getKey("down");
		break;
	//delete
	case 46:
		key = "\x1b[3~";
		break;
	//insert
	case 45:
		key = "\x1b[2~";
		break;
	//home
	case 36:
		key = "\x1bOH";
		break;
	//end
	case 35:
		key = "\x1bOF";
		break;
	//page up
	case 33:
		key = "\x1b[5~";
		break;
	//page down
	case 34:
		key = "\x1b[6~";
		break;
	//F1
	case 112:
		key = "\x1bOP";
		break;
	//F2
	case 113:
		key = "\x1bOQ";
		break;
	//F3
	case 114:
		key = "\x1bOR";
		break;
	//F4
	case 115:
		key = "\x1bOS";
		break;
	//F5
	case 116:
		key = "\x1b[15~";
		break;
	//F6
	case 117:
		key = "\x1b[17~";
		break;
	//F7
	case 118:
		key = "\x1b[18~";
		break;
	//F8
	case 119:
		key = "\x1b[19~";
		break;
	//F9
	case 120:
		key = "\x1b[20~";
		break;
	//F10
	case 121:
		key = "\x1b[21~";
		break;
	//F11
	case 122:
		key = "\x1b[23~";
		break;
	//F12
	case 123:
		key = "\x1b[24~";
		break;
	default:
		//a - z and space
		if (ev.ctrlKey) {
			if (keyCode >= 65 && keyCode <= 90)
				key = String.fromCharCode(keyCode - 64);
			else if (keyCode === 32)
				//NUL
				key = String.fromCharCode(0);
			else if (keyCode >= 51 && keyCode <= 55)
				//escape, file sep, group sep, record sep, unit sep
				key = String.fromCharCode(keyCode - 51 + 27);
			else if (keyCode === 56)
				//delete
				key = String.fromCharCode(127);
			else if (keyCode === 219)
				//^[-escape
					key = String.fromCharCode(27);
			else if (keyCode === 221)
				//^] - group sep
				key = String.fromCharCode(29);
		} else if (ev.altKey) {
			if (keyCode >= 65 && keyCode <= 90)
				key = "\x1b" + String.fromCharCode(keyCode + 32);
			else if (keyCode === 192)
				key = "\x1b`";
			else if (keyCode >= 48 && keyCode <= 57)
				key = "\x1b" + (keyCode - 48);
		}
		break;
	}
	if(key !== undefined) {
		this.target.contentEditable=false;
		this.push(key);
		return this._cancelEvent(ev);
	}
};

DomInput.canHandle = require("../output/dom.js").canHandle;
