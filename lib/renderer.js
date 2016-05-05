/**
 * This class keeps a logical mapping of lines to messages.
 * It doesn't actually render or send messages, it delegates
 * that task to the renderer.
 **/

var escapeHtml = require("escape-html");
var utils = require("./utils");

function Renderer(reply, state, options) {
  if (!options) options = {};
  this.reply = reply;
  this.state = state;
  this.options = options;

  this.offset = 0;
  this.messages = [];
  this.orphanLines = [];
  this.unfinishedLine = null;
  this.totalLines = 0;

  state.on("lineChanged", this._lineChanged.bind(this));
  state.on("linesRemoving", this._linesRemoving.bind(this));
  state.on("linesScrolling", this._linesScrolling.bind(this));
  state.on("linesInserted", this._linesInserted.bind(this));

  this.initTimers();
}


/** MESSAGE MAPPING **/

Renderer.prototype.ensureLinesCreated = function ensureLinesCreated(y) {
  if (this.totalLines < y) {
    this.orphanLines = this.orphanLines.concat(this.state.lines.slice(this.totalLines, y));
    this.totalLines = y;
  }
}

Renderer.prototype._lineChanged = function _lineChanged(y) {
  this.ensureLinesCreated(y+1);
};

Renderer.prototype._linesRemoving = function _linesRemoving(y, n) {
  this.ensureLinesCreated(this.state.lines.length);

  // Seek until we arrive at the wanted line
  y += this.offset;
  var idx = 0, lineIdx = 0;
  while (y) {
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx];
    if (lineIdx < lines.length) { lineIdx++; y--; }
    else idx++;
  }

  // Remove following lines
  this.totalLines -= n;
  while (n) {
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx];
    if (lines.splice(0, 1)) n--;
    else idx++;
  }
};

Renderer.prototype._linesScrolling = function _linesScrolling(n) {
  this.ensureLinesCreated(this.state.lines.length);

  if (n > 0) {
    // Scrolling up: increment offset, discarding message if necessary
    this.offset += n;
    this.totalLines -= n;
    while (this.messages.length) {
      var message = this.messages[0];
      if (message.lines.length > this.offset) break;
      this.offset -= message.lines.length;
      this.messages.shift();
    }
  } else {
    // Scrolling down: just delete bottom lines (leaving them would complicate everything)
    n = -n;
    this._linesRemoving(this.state.lines.length - n, n);
  }
};

Renderer.prototype._linesInserted = function _linesInserted(y, n) {
  this.ensureLinesCreated(y);
  var pos = y;

  // Seek until we arrive at the wanted line, *just before the next one*
  y += this.offset;
  var idx = 0, lineIdx = 0;
  while (true) {
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx];
    if (lineIdx < lines.length) {
      if (!y) break;
      lineIdx++; y--;
    } else idx++;
  }

  // Insert lines
  this.totalLines += n;
  while (n) {
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx];
    lines.unshift(lineIdx, 0, this.state.lines[pos]);
    n--, lineIdx++, pos++;
  }
};

Renderer.prototype.update = function update() {
  this.ensureLinesCreated(this.state.lines.length);
 
  // Rerender messages, scheduling flush if some changed
  this.messages.forEach(function (message) {
    var rendered = this.render(message);
    if (rendered !== message.rendered) {
      message.rendered = rendered;
      this.editedLineTimer.set();
    }
  }.bind(this));

  // Make sure orphan lines are processed
  this.orphanLinesUpdated();
};

Renderer.prototype.emitMessage = function emitMessage(count, silent) {
  if (count < 0 || count > this.orphanLines.length) throw new Error("Should not happen.");

  if (count > this.options.maxLinesEmitted)
    count = this.options.maxLinesEmitted;
  var lines = this.orphanLines.splice(0, count);
  var message = { lines: lines };
  this.messages.push(message);
  message.rendered = this.render(message);
  message.ref = new utils.EditedMessage(this.reply.silent(silent), message.rendered, "HTML");
  this.orphanLinesUpdated();
};


/** HTML RENDERING **/

/* Given a line, return true if potentially monospaced */
Renderer.prototype.evaluateCode = function evaluateCode(str) {
  // TODO
};

/* Given a message object, render to an HTML snippet */
Renderer.prototype.render = function render(message) {
  return message.lines.map(function (line) {
    var hasCursor = (this.state.getMode("cursor")) && (this.state.getLine() === line);
    if (!line.code && this.evaluateCode(line.str)) line.code = true;

    var content = line.str;
    if (hasCursor) {
      var x = this.state.cursor[0];
      var cursorString = this.state.getMode("cursorBlink") ? this.options.cursorBlinkString : this.options.cursorString;
      content = escapeHtml(content.substring(0, x)) + cursorString + escapeHtml(content.substring(x));
    } else content = escapeHtml(content);

    if (line.code) content = "<code>" + content + "</code>";
    return content;
  }.bind(this)).join("\n");
};


/** FLUSH SCHEDULING **/

Renderer.prototype.initTimers = function initTimers() {
  // Set when an existent line changes, cancelled when edited lines flushed
  this.editedLineTimer = new utils.Timer(this.options.editTime, this.flushEdited.bind(this));

  // Set when a new line is added or changed, cancelled on new lines flush
  this.newChunkTimer = new utils.Timer(this.options.chunkTime, this.flushNew.bind(this));
  // Reset when a new line is added or changed, cancelled on new lines flush
  this.newLineTimer = new utils.Timer(this.options.lineTime, this.flushNew.bind(this));

  // Set when there is an unfinished nonempty line, cancelled when reference changes or line becomes empty
  this.unfinishedLineTimer = new utils.Timer(this.options.unfinishedTime, this.flushUnfinished.bind(this));
};

Renderer.prototype.orphanLinesUpdated = function orphanLinesUpdated() {
  console.log("orphanLinesUpdated:",this.orphanLines);
  var newLines = this.orphanLines.length - 1;
  if (newLines >= this.options.maxLinesWait) {
    // Flush immediately
    this.flushNew();
  } else if (newLines >= 0) {
    this.newChunkTimer.set();
  } else {
    this.newChunkTimer.cancel();
    this.newLineTimer.cancel();
  }

  // Update unfinished line
  var unfinishedLine = this.orphanLines[this.orphanLines.length - 1];
  if (this.unfinishedLine !== unfinishedLine) {
    this.unfinishedLine = unfinishedLine;
    this.unfinishedLineTimer.cancel();
  }

  if (unfinishedLine && unfinishedLine.str.length) this.unfinishedLineTimer.set();
  else this.unfinishedLineTimer.cancel();
};

Renderer.prototype.flushEdited = function flushEdited() {
  this.messages.forEach(function (message) {
    if (message.rendered !== message.ref.lastText)
      message.ref.edit(message.rendered);
  });
  this.editedLineTimer.cancel();
};

Renderer.prototype.flushNew = function flushNew() {
  this.flushEdited();
  if (this.orphanLines.length <= 1) return;
  this.emitMessage(this.orphanLines.length - 1, !!this.options.silent);
};

Renderer.prototype.flushUnfinished = function flushUnfinished() {
  this.flushNew();
  if (this.orphanLines.length < 1 || this.orphanLines[0].str.length === 0) return;
  this.emitMessage(1, !!this.options.unfinishedSilent);
};



exports.Renderer = Renderer;
