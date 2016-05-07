/**
 * This class keeps a logical mapping of lines to messages.
 * It doesn't actually render or send messages, it delegates
 * that task to the renderer.
 *
 * FIXME: do something to prevent extremely long messages to be
 * sent (and rejected) when too many lines are inserted in between
 * a message.
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
    this.newLinesChanged = true;
  }
};

Renderer.prototype._lineChanged = function _lineChanged(y) {
  if (this.state.length - y <= this.orphanLines.length)
    this.newLinesChanged = true;
};

Renderer.prototype._linesRemoving = function _linesRemoving(y, n) {
  this.ensureLinesCreated(this.state.lines.length);

  // Seek until we arrive at the wanted line
  y += this.offset;
  var idx = 0, lineIdx = 0;
  while (y) {
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx].lines;
    if (lineIdx < lines.length) { lineIdx++; y--; }
    else { idx++; lineIdx = 0; }
  }

  // Remove following lines
  this.totalLines -= n;
  while (n) {
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx].lines;
    if (lines.splice(lineIdx, 1).length) n--;
    else { idx++; lineIdx = 0; }
  }

  if (idx >= this.messages.length) this.newLinesChanged = true;
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
      if (message.rendered !== message.ref.lastText) break;
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
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx].lines;
    if (lineIdx < lines.length) {
      if (!y) break;
      lineIdx++; y--;
    } else { idx++; lineIdx = 0; }
  }

  // Insert lines
  this.totalLines += n;
  while (n) {
    var lines = (idx === this.messages.length) ? this.orphanLines : this.messages[idx].lines;
    lines.splice(lineIdx, 0, this.state.lines[pos]);
    n--, lineIdx++, pos++;
  }

  if (idx === this.messages.length) this.newLinesChanged = true;
};

Renderer.prototype.update = function update() {
  this.ensureLinesCreated(this.state.lines.length);
 
  // Rerender messages, scheduling flush if some changed
  var linesChanged = false;
  this.messages.forEach(function (message) {
    var rendered = this.render(message);
    if (rendered !== message.rendered) {
      message.rendered = rendered;
      linesChanged = true;
    }
  }.bind(this));

  if (linesChanged) this.editedLineTimer.set();
  if (this.newLinesChanged) this.newLineTimer.reset();
  this.newLinesChanged = false;

  // Make sure orphan lines are processed
  this.orphanLinesUpdated();
};

Renderer.prototype.emitMessage = function emitMessage(count, silent, disablePreview) {
  if (count < 0 || count > this.orphanLines.length) throw new Error("Should not happen.");

  if (count > this.options.maxLinesEmitted)
    count = this.options.maxLinesEmitted;
  var lines = this.orphanLines.splice(0, count);
  var message = { lines: lines };
  this.messages.push(message);
  message.rendered = this.render(message);
  var reply = this.reply.silent(silent).disablePreview(disablePreview);
  message.ref = new utils.EditedMessage(reply, message.rendered, "HTML");
  this.orphanLinesUpdated();
};


/** HTML RENDERING **/

/* Given a line, return true if potentially monospaced */
Renderer.prototype.evaluateCode = function evaluateCode(str) {
  //FIXME: line just between two code lines should be come code
  if (str.indexOf("   ") !== -1 || /[-_,:;<>()/\\~|'"=^]{4}/.exec(str))
    return true;
  return false;
};

/* Given a message object, render to an HTML snippet */
Renderer.prototype.render = function render(message) {
  var cursorString = this.state.getMode("cursorBlink") ? this.options.cursorBlinkString : this.options.cursorString;
  var isWhitespace = true, x = this.state.cursor[0];

  var html = message.lines.map(function (line, idx) {
    var hasCursor = (this.state.getMode("cursor")) && (this.state.getLine() === line);
    if (!line.code && this.evaluateCode(line.str)) line.code = true;

    var content = line.str;
    if (hasCursor || line.str.trim().length) isWhitespace = false;
    if (idx === 0 && !content.substring(0, this.options.startFill.length).trim()) {
      // The message would start with spaces, which would get trimmed by telegram
      if (!(hasCursor && x < this.options.startFill.length))
        content = this.options.startFill + content.substring(this.options.startFill.length);
    }

    if (hasCursor)
      content = escapeHtml(content.substring(0, x)) + cursorString + escapeHtml(content.substring(x));
    else
      content = escapeHtml(content);

    if (line.code) content = "<code>" + content + "</code>";
    return content;
  }.bind(this)).join("\n");

  if (isWhitespace) return "<em>(empty)</em>";
  return html;
};


/** FLUSH SCHEDULING **/

Renderer.prototype.initTimers = function initTimers() {
  // Set when an existent line changes, cancelled when edited lines flushed
  this.editedLineTimer = new utils.Timer(this.options.editTime).on("fire", this.flushEdited.bind(this));

  // Set when a new line is added or changed, cancelled on new lines flush
  this.newChunkTimer = new utils.Timer(this.options.chunkTime).on("fire", this.flushNew.bind(this));
  // Reset when a new line is added or changed, cancelled on new lines flush
  this.newLineTimer = new utils.Timer(this.options.lineTime).on("fire", this.flushNew.bind(this));

  // Set when there is an unfinished nonempty line, cancelled when reference changes or line becomes empty
  this.unfinishedLineTimer = new utils.Timer(this.options.unfinishedTime).on("fire", this.flushUnfinished.bind(this));

  this.newChunkTimer.on("active", function () {
    this.reply.action("typing");
  }.bind(this));
  //FIXME: should we emit actions on edits?
};

Renderer.prototype.orphanLinesUpdated = function orphanLinesUpdated() {
  var newLines = this.orphanLines.length - 1;
  if (newLines >= this.options.maxLinesWait) {
    // Flush immediately
    this.flushNew();
  } else if (newLines > 0) {
    this.newChunkTimer.set();
  } else {
    this.newChunkTimer.cancel();
    this.newLineTimer.cancel();
  }

  // Update unfinished line
  var unfinishedLine = this.orphanLines[this.orphanLines.length - 1];
  if (unfinishedLine && this.totalLines === this.state.rows && unfinishedLine.str.length === this.state.columns)
    unfinishedLine = null;

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
  var count = this.orphanLines.length;
  if (this.unfinishedLine) count--;
  if (count <= 0) return;
  this.emitMessage(count, !!this.options.silent, !!this.options.hidePreview);
};

Renderer.prototype.flushUnfinished = function flushUnfinished() {
  do this.flushNew(); while (this.orphanLines.length > 1);
  if (this.orphanLines.length < 1 || this.orphanLines[0].str.length === 0) return;
  this.emitMessage(1, !!this.options.unfinishedSilent, !!this.options.unfinishedHidePreview);
};



exports.Renderer = Renderer;
