/**
 * Miscellaneous utilities.
 **/

/** TIMER **/

function Timer(delay, callback) {
  this.delay = delay;
  this.callback = callback;
}

/* Starts the timer, does nothing if started already. */
Timer.prototype.set = function set() {
  if (this.timeout) return;
  this.timeout = setTimeout(function () {
    this.timeout = null;
    this.callback();
  }.bind(this), this.delay);
};

/* Cancels the timer if set. */
Timer.prototype.cancel = function cancel() {
  if (!this.timeout) return;
  clearTimeout(this.timeout);
  delete this.timeout;
};

/* Starts the timer, cancelling first if set. */
Timer.prototype.reset = function reset() {
  this.cancel();
  this.set();
};

/** EDITED MESSAGE **/

function EditedMessage(reply, text, mode) {
  this.reply = reply.detached();
  this.mode = mode;

  this.lastText = text;
  this.text = text;
  this.callbacks = [];
  this.pendingText = null;
  this.pendingCallbacks = [];

  reply.text(this.text, this.mode).then(this._whenEdited.bind(this));
}

EditedMessage.prototype.edit = function edit(text, callback) {
  this.lastText = text;
  var idle = this.callbacks === undefined;
  if (callback) this.pendingCallbacks.push(callback);

  if (text === this.text) {
    this.callbacks = (this.callbacks || []).concat(this.pendingCallbacks);
    this.pendingText = null;
    this.pendingCallbacks = [];
    if (idle) this._whenEdited();
  } else {
    this.pendingText = text;
    if (idle) this._flushEdit();
  }
};

EditedMessage.prototype._flushEdit = function _flushEdit() {
  this.text = this.pendingText;
  this.callbacks = this.pendingCallbacks;
  this.pendingText = null;
  this.pendingCallbacks = [];
  this.reply.editText(this.id, this.text, this.mode).then(this._whenEdited.bind(this));
};

EditedMessage.prototype._whenEdited = function _whenEdited(err, result, next) {
  if (err) throw err;
  if (this.id === undefined) this.id = result.message_id;
  var callbacks = this.callbacks;
  delete this.callbacks;
  callbacks.forEach(function (callback) { callback(); });
  if (this.pendingText !== null) this._flushEdit();
  if (next) next();
};

/** SANITIZED ENV **/

function getSanitizedEnv() {
  // Adapted from pty.js source
  var env = Object.create(process.env);

  // Make sure we didn't start our
  // server from inside tmux.
  delete env.TMUX;
  delete env.TMUX_PANE;

  // Make sure we didn't start
  // our server from inside screen.
  // http://web.mit.edu/gnu/doc/html/screen_20.html
  delete env.STY;
  delete env.WINDOW;

  // Delete some variables that
  // might confuse our terminal.
  delete env.WINDOWID;
  delete env.TERMCAP;
  delete env.COLUMNS;
  delete env.LINES;

  return env;
}



exports.Timer = Timer;
exports.EditedMessage = EditedMessage;
exports.getSanitizedEnv = getSanitizedEnv;
