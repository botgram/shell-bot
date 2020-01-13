"use strict";

var myUtil = require("./util.js");

function getChanged(oldObj, newObj) {
	var result = {};
	var i;
	if(newObj instanceof Array) {
		for(i = 0; i < newObj.length || i < oldObj.length; i++) {
			if(newObj[i] !== oldObj[i])
				result[i] = newObj[i];
		}
	}
	else {
		for(i in newObj) {
			if(newObj[i] !== oldObj[i])
				result[i] = newObj[i];
		}
	}
	return result;
}

function diffAttr(attr1, attr2) {
	var a, p, i, j;

	a = Object.keys(attr1);
	for(i = 0; i < a.length; i++) {
		if(!attr2[a[i]])
			return false;
		p = Object.keys(attr1[a[i]]);
		for(j = 0; j < p.length; j++) {
			if(attr1[a[i]][p[j]] !== attr2[a[i]][p[j]])
				return false;
		}
	}
	return true;
}

function TermDiff(oldState, newState) {
	this._changes = [];
	this._cursor = null;
	this._scrollRegion = null;
	this._savedCursor = null;
	this._modes = null;
	this._leds = null;
	this._size = null;
	this._tabs = null;
	this._columns = null;
	this._rows = null;

	if(typeof oldState === "object" && oldState.getLine) {
		this.oldState = oldState;
		this.newState = newState;

		this._mkDiff(oldState, newState);
		this._mkCursor(oldState, newState);
		this._mkScrollRegion(oldState, newState);
		this._mkModes(oldState, newState);
		this._mkLeds(oldState, newState);
		this._mkSize(oldState, newState);
		this._mkTabs(oldState, newState);
	}
	else if(typeof oldState === "string") {
		var json = JSON.parse(oldState);
		this._loadJson(json);
	}
	else {
		this._loadJson(oldState);
	}
}
module.exports = TermDiff;

TermDiff.prototype._mkCursor = function(oldState, newState){
	if(oldState.cursor.x !== newState.cursor.x ||
		 oldState.cursor.y !== newState.cursor.y)
		this._cursor = myUtil.extend({}, newState.cursor);
	if(oldState._savedCursor.x !== newState._savedCursor.x ||
		 oldState._savedCursor.y !== newState._savedCursor.y)
		this._savedCursor = myUtil.extend({}, newState._savedCursor);
};

TermDiff.prototype._mkScrollRegion = function(oldState, newState){
	this._scrollRegion = newState._scrollRegion.slice();
};

TermDiff.prototype._mkModes = function(oldState, newState){
	this._modes = getChanged(oldState._modes, newState._modes);
};

TermDiff.prototype._mkLeds = function(oldState, newState){
	this._leds = getChanged(oldState._leds, newState._leds);
};

TermDiff.prototype._mkSize = function(oldState, newState){
	if(oldState.columns !== newState.columns || oldState.rows !== newState.rows) {
		this._rows = newState.rows;
		this._columns = newState.columns;
	}
};

TermDiff.prototype._mkTabs = function(oldState, newState){
	this._tabs = newState._tabs.slice();
};


TermDiff.prototype._getChange = function(line) {
	var l = {l: line};
	for(var i = this._changes.length - 1; i >= 0; i--) {
		if(this._changes[i].l === line)
			return this._changes[i];
		else if(this._changes[i].l < line) {
			this._changes.splice(i+1, 0, l);
			return l;
		}
	}
	this._changes.unshift(l);
	return l;
};

TermDiff.prototype._cmpLines = function(line1, line2) {
	var i, j, a, p;
	if(line1 === line2)
		return true;
	else if(line1 === undefined || line2 === undefined)
		return false;
	else if(line1.str !== line2.str)
		return false;

	return diffAttr(line1.attr, line2.attr) && diffAttr(line2.attr, line1.attr);
};

TermDiff.prototype._mkDiff = function(oldState, newState) {
	var m = Math.max(1, oldState.getBufferRowCount()),
	n = Math.max(1, newState.getBufferRowCount());

	var left = -1, up = -m, diag = left + up;
	var seq = new Array(m * n);
	var dir = seq.slice(0);
	var i,j,k,l, toJ, toK;

	for(i = 0; i < seq.length; i++) {
		j = i % m;
		k = ~~(i / m); // Cast to int
		var hasDiffs = this._cmpLines(oldState.getLine(j), newState.getLine(k));
		if(hasDiffs)
			dir[i] = diag;
		else if(seq[i + left] <= seq[i + up])
			dir[i] = up;
		else
			dir[i] = left;
		seq[i] = ~~(diag === dir[i]) + ~~(j === 0 ? 0 : seq[i + dir[i]]);
	}

	k = n-1;
	j = m-1;
	for(i = seq.length - 1; i >= 0; j--, k--, i+=dir[i]) {
		// Goto next common line
		for(; !isNaN(i) && dir[i] !== diag; i += dir[i]);

		toJ = i % m;
		toK = ~~(i / m); // Cast to int
		if(isNaN(i))
			toJ = toK = -1;

		// changed or inserted
		for(; k > toK; j = Math.max(j-1, toJ), k--) {
			this._getChange(k)[j > toJ ? "." : "+"] = newState.getLine(k);
		}

		// line is in old, but not in new
		for(; j > toJ; j--) {
			l = this._getChange(toK+1);
			l["-"] = (l["-"] || 0) + 1;
		}

		if(j === 0 && (dir[i] === diag || dir[i] === left))
			dir[i] = up;
	}
};

TermDiff.prototype.toJSON = function() {
	return {
		changes: this._changes,
		cursor: this._cursor,
		savedCursor: this._savedCursor,
		leds: this._leds,
		modes: this._modes,
		size: this._size,
		tabs: this._tabs,
		scrollRegion: this._scrollRegion
	};
};

TermDiff.prototype.toString = function() {
	var i,j;
	var result = [];
	var lastline = 0;
	var oldNbr = this._changes[0] ? this._changes[0].l : 0;
	for(i = 0; i < this._changes.length; i++, lastline++, oldNbr++) {
		for(; lastline < this._changes[i].l; lastline++, oldNbr++) {
			result.push(" " + this.newState.getLine(lastline).str);
		}
		for(j = 0; j < this._changes[i]["-"]; j++) {
			result.push("-" + this.oldState.getLine(oldNbr).str);
		}
		if(this._changes[i]["+"]) {
			result.push("+" + this._changes[i]["+"].str);
			oldNbr--;
		}
		if(this._changes[i]["."]) {
			result.push("." + this._changes[i]["."].str);
		}
	}
	return result.join("\n");
};

TermDiff.prototype._loadJson = function(diff) {
	this._cursor = diff.cursor;
	this._savedCursor = diff.savedCursor;
	this._scrollRegion = diff.scrollRegion;
	this._modes = diff.modes;
	this._leds = diff.leds;
	this._rows = diff.rows;
	this._columns = diff.columns;
	this._changes = diff.changes;
	this._tabs = diff.tabs;
};

TermDiff.prototype.apply = function(diff) {
	if(this._columns || this._rows) this._applySize(diff);
	if(this._cursor) this._applyCursor(diff);
	if(this._scrollRegion) this._applyScrollRegion(diff);
	if(this._leds) this._applyLeds(diff);
	if(this._tabs) this._applyTabs(diff);
	if(this._savedCursor)this._applySavedCursor(diff);
	if(this._modes) this._applyModes(diff);
	if(this._changes) this._applyChanges(diff);
};

TermDiff.prototype._applySize = function(t) {
	t.resize({columns: this._columns, rows: this._rows });
};

TermDiff.prototype._applyCursor = function(t) {
	t.setCursor(this._cursor.x, this._cursor.y);
};

TermDiff.prototype._applyScrollRegion = function(t) {
	t.setScrollRegion(this._scrollRegion[0], this._scrollRegion[1]);
};

TermDiff.prototype._applyLeds = function(t) {
	for(var k in this._leds)
		t.setLed(k, this._leds[k]);
};

TermDiff.prototype._applySavedCursor = function(t) {
	t._savedCursor.x = this._savedCursor.x;
	t._savedCursor.y = this._savedCursor.y;
};

TermDiff.prototype._applyTabs = function(t) {
	t.tabs = this._tabs.slice();
};

TermDiff.prototype._applyModes = function(t) {
	for (var m in this._modes) {
		t.setMode(m,this._modes[m]);
	}
};

TermDiff.prototype._applyChanges = function(t) {
	for(var i = 0; i < this._changes.length; i++) {
		var c = this._changes[i];
		if (c["-"])
			t._removeLine(c.l, c["-"]); // removing lines

		if (c["+"])
			t._insertLine(c.l, c["+"]); // adding lines
		else if (c["."])
			t.setLine(c.l, c["."]); // replacing lines
	}
};
