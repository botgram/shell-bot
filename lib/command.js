/**
 * Attaches to a chat, spawns a pty, attaches it to the terminal emulator
 * and the renderer and manages them. Handles incoming commands & input,
 * and posts complimentary messages such as command itself and output code.
 **/

var util = require("util");
var escapeHtml = require("escape-html");
var pty = require("pty.js");
var utils = require("./utils");
var terminal = require("./terminal");
var renderer = require("./renderer");

function Command(reply, context, command) {
  this.reply = reply;
  this.command = command;
  this.pty = pty.spawn(context.shell, ["-c", command], {
    cols: context.size.columns,
    rows: context.size.rows,
    cwd: context.cwd,
    env: context.env,
  }); //FIXME: disable ISIG, ICANON, IEXTEN
  this.terminal = terminal.createTerminal({
    columns: context.size.columns,
    rows: context.size.rows,
  });
  this.state = this.terminal.state;
  this.renderer = new renderer.Renderer(reply, this.state, {
    cursorString: "\uD83D\uDD38",
    cursorBlinkString: "\uD83D\uDD38",
    silent: context.silent,
    unfinishedSilent: true,
    maxLinesWait: 20,
    maxLinesEmitted: 30,
    lineTime: 400,
    chunkTime: 3000,
    editTime: 200,
    unfinishedTime: 1000,
  });
  //FIXME: reduce rate when talking to supergroups (and maybe groups?)

  // Post initial message
  this.initialMessage = new utils.EditedMessage(reply, this._renderInitial(), "HTML");

  // Process command output
  this.pty.on("data", this._ptyReadable.bind(this)); //FIXME

  // Handle command exit
  this.pty.on("exit", this._exit.bind(this));
}
util.inherits(Command, require("events").EventEmitter);

Command.prototype._renderInitial = function _renderInitial() {
  var content = "", title = this.state.metas.title;
  if (title) content += escapeHtml(title) + "\n";
  content += "<strong>$ " + escapeHtml(this.command) + "</strong>";
  return content;
}

Command.prototype._ptyReadable = function _ptyReadable(chunk) {
  //FIXME: implement some backpressure, for example, read smaller chunks, stop reading if there are >= 20 lines waiting to be pushed, set the HWM
  //var chunk = this.pty.socket.read();
  if (chunk === null) return;
  if ((typeof chunk !== "string") && !(chunk instanceof String))
    throw new Error("Expected a String, you liar.");
  this.terminal.write(chunk, "utf-8", this._update.bind(this));
};

Command.prototype._update = function _update() {
  this.initialMessage.edit(this._renderInitial());
  this.renderer.update();
};

Command.prototype.resize = function resize(size) {
  this.state.resize(size);
  this.state._update();
  this.pty.resize(size.columns, size.rows);
};

Command.prototype.sendSignal = function sendSignal(signal, group) {
  var pid = this.pty.pid;
  if (group) pid = -pid;
  process.kill(pid, signal);
};

Command.prototype.sendEof = function sendEof() {
  //FIXME: enable ICANON, write KILL character, restore
  this.pty.write("\x04");
};

Command.prototype._exit = function _exit(code, signal) {
  this.renderer.flushUnfinished();

  //FIXME: could wait until all edits are made before posting exited message
  var exitedText;
  if (signal)
    exitedText = "\uD83D\uDC80 <strong>Killed</strong> by "+utils.resolveSignal(signal)+".";
  else if (code === 0)
    exitedText = "\u2705 <strong>Exited</strong> correctly.";
  else
    exitedText = "\u26D4 <strong>Exited</strong> with "+code+".";
  this.reply.html(exitedText);

  // FIXME: Stop processing queue

  this.emit("exit");
};

Command.prototype.handleReply = function handleReply(msg) {
  //TODO: only process if we know all message IDs, otherwise add to queue
  //TODO: try to match replied message to renderer messages, or initial message

  //FIXME: feature: if photo, file, video, voice or music, put the terminal in raw mode, hold off further input, pipe binary asset to terminal, restore
  //Flags we would need to touch: -INLCR -IGNCR -ICRNL -IUCLC -ISIG -ICANON -IEXTEN, and also for convenience -ECHO -ECHONL

  if (msg.type !== "text") return false;
  this.sendInput(msg.text);
};

Command.prototype.sendInput = function sendInput(text) {
  this.pty.write(text.replace(/\n/g, "\r") + "\r");
};



exports.Command = Command;
