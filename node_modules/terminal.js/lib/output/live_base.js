"use strict";

var inherits = require("util").inherits;

var dummy = function() {};

function LiveBaseOutput(state, writer, target, opts) {
	LiveBaseOutput.super_.apply(this, arguments);

	var i;
	this.target = target;
	this.writer = writer;
	this._views = [];
	this._oldViews = [];
	this._cursorView = null;
	this._cursorDrawnAt = null;
	this._timeout = null;

	this._queue = [];

	var self = this;
	state.on("lineremove",
		function() { self._removeLine.apply(self, arguments); });
	state.on("linechange",
		function() { self._changeLine.apply(self, arguments); });
	state.on("lineinsert",
		function() { self._insertLine.apply(self, arguments); });
	state.on("ledchange",
		function() { self._changeLed.apply(self, arguments); });
	state.on("cursormove",
		function() { self._setCursor.apply(self, arguments); });
	state.on("resize",
		function() { self._resize.apply(self, arguments); });
	state.on("bell",
		function() { self._bell.apply(self, arguments); });
	writer.on("ready",
		function() { self._checkCommit(); });
}
inherits(LiveBaseOutput, require("./base"));
module.exports = LiveBaseOutput;

LiveBaseOutput.prototype._schedule = function(view, cb) {
	var i;

	for(i = 0; i < this._queue.length; i++) {
		if(this._queue[i].view !== view)
			continue;
		this._queue[i].cb = cb;
		return;
	}
	this._queue.unshift({ view: view, cb: cb });
};

LiveBaseOutput.prototype._flush = function(flush) {
	var i;

	for(i = 0; i < this._queue.length; i++) {
		this._queue[i].cb.call(this, this._queue[i].view);
	}
	this._queue = [];
};

LiveBaseOutput.prototype._updateCursor = function(action, number) {
	if(!this._opts.adhesiveCursor || this._cursorDrawnAt === null)
		return;

	switch(action) {
	case "insert":
		if(number <= this._cursorDrawnAt)
			this._cursorDrawnAt = Math.min(this._cursorDrawnAt + 1, this.state.rows - 1);
		break;
	case "remove":
		if(number < this._cursorDrawnAt)
			this._cursorDrawnAt--;
		else if(number === this._cursorDrawnAt)
			this._cursorDrawnAt = null;
		break;
	}
};

LiveBaseOutput.prototype._removeLine = function(number) {
	var viewContainer = this._views.splice(number, 1)[0];
	var view = this.removeLine(number, viewContainer.view);
	if(view) {
		viewContainer.view = view;
		this._oldViews.push(viewContainer);
	}
	this._updateCursor("remove", number);
};

LiveBaseOutput.prototype._changeLine = function(number, line, cursor) {
	if(!this.state.getMode("cursor"))
		cursor = undefined;
	this._schedule(this._views[number], function(viewContainer) {
		var view = this.changeLine(number, viewContainer.view, line, cursor);
		if(view !== undefined)
			viewContainer.view = view;
		if(cursor !== undefined)
			this._cursorDrawnAt = number;
	});
};

LiveBaseOutput.prototype._insertLine = function(number, line, cursor) {
	var viewContainer = this._oldViews.shift() || {view: this.createView() };
	var view = this.insertLine(
		number,
		viewContainer.view,
		line, cursor);
	if(view !== undefined)
		viewContainer.view = view;
	this._views.splice(number, 0, viewContainer);
	this._updateCursor("insert", number);
};

LiveBaseOutput.prototype._changeLed = function() {
	this.changeLed.apply(this, arguments);
};

LiveBaseOutput.prototype._setCursor = function(x, y) {
	this._cursorView = this.setCursor(x, y);
};

LiveBaseOutput.prototype._resize = function(size) {
	this._flush();
	this.resize(size);
};

LiveBaseOutput.prototype._checkCommit = function() {
	var self = this, args = arguments;

	if (!this._opts.renderInterval)
		return this._commit.apply(this, args);

	if (this._timeout !== null)
		return;
	this._timeout = setTimeout(function() {
		self._commit.apply(self, args);
		self._timeout = null;
	}, this._opts._renderInterval);
};

LiveBaseOutput.prototype._commit = function() {
	var c = this.state.cursor;
	if(c.y !== this._cursorDrawnAt && this._cursorDrawnAt !== null) {
		this._changeLine(this._cursorDrawnAt, this.state.getLine(this._cursorDrawnAt));
	}

	if(c.y < this._views.length) {
		this._changeLine(c.y, this.state.getLine(c.y), c.x);
	}
	this._flush();

	this.commit.apply(this, arguments);
};

LiveBaseOutput.prototype._bell = function() {
	this.bell.apply(this, arguments);
};


LiveBaseOutput.prototype.createView =
LiveBaseOutput.prototype.removeLine =
LiveBaseOutput.prototype.changeLine =
LiveBaseOutput.prototype.insertLine =
LiveBaseOutput.prototype.changeLed =
LiveBaseOutput.prototype.setCursor =
LiveBaseOutput.prototype.resize =
LiveBaseOutput.prototype.bell =
LiveBaseOutput.prototype.commit = dummy;
