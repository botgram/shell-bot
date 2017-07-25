/**
 * Implements a simple select-replace file editor in Telegram.
 * It works as follows:
 *
 *  1. The user invokes the editor with a non-empty file.
 *  2. The contents of the file are posted as a message.
 *  3. The user replies to that message with (part of) the text.
 *     The bot will locate that substring in the file contents and track the message.
 *  4. The user edits his message.
 *     The bot will then replace the original substring, save the file and edit its message.
 *     If there are any problems with saving the file, the editor may detach.
 *
 * NOTE: sync I/O is used for simplicity; be careful! (TODO)
 **/

var fs = require("fs");
var escapeHtml = require("escape-html");
var utils = require("./utils");

function ChunkedString(text) {
  this.text = text;
  this.chunks = [];
}

ChunkedString.prototype.findAcquire = function findAcquire(text) {
  if (text.length == 0) throw Error("Empty find text not allowed");
  var index = this.text.indexOf(text);
  if (index == -1)
    throw Error("The substring was not found. Wrapping in tildes may be necessary.");
  if (index != this.text.lastIndexOf(text))
    throw Error("There are multiple instances of the passed substring");
  return this.acquire(index, text.length);
};

ChunkedString.prototype.acquire = function acquire(offset, length) {
  if (offset < 0 || length <= 0 || offset + length > this.text.length)
    throw Error("Invalid coordinates");
  for (var i = 0; i < this.chunks.length; i++) {
    var c = this.chunks[i];
    if (offset + length > c.offset || c.offset + c.text.length > offset)
      throw Error("Chunk overlaps");
  }
  var chunk = { offset: offset, text: this.text.substring(offset, offset + length) };
  this.chunks.push(chunk);
  return chunk;
};

ChunkedString.prototype.release = function release(chunk) {
  if (this.chunks.indexOf(chunk) == -1) throw Error("Invalid chunk given");
  this.chunks.splice(index, 1);
};

ChunkedString.prototype.modify = function modify(chunk, text) {
  if (this.chunks.indexOf(chunk) == -1) throw Error("Invalid chunk given");
  if (text.length == 0) throw Error("Empty replacement not allowed");
  var end = chunk.offset + chunk.text.length;
  this.text = this.text.substring(0, chunk.offset) + text + this.text.substring(end);
  var diff = text.length - chunk.text.length;
  chunk.text = text;
  this.chunks.forEach(function (c) {
    if (c.offset > chunk.offset) c.offset += diff;
  });
};


function Editor(reply, file, encoding) {
  if (!encoding) encoding = "utf-8";
  this.reply = reply;
  this.file = file;
  this.encoding = encoding;

  // TODO: support for longer files (paginated, etc.)
  // FIXME: do it correctly using fd, keeping it open
  var contents = fs.readFileSync(file, encoding);
  if (contents.length > 1500 || contents.split("\n") > 50)
    throw Error("The file is too long");

  this.contents = new ChunkedString(contents);
  this.chunks = {}; // associates each message ID to an active chunk

  this.message = new utils.EditedMessage(reply, this._render(), "HTML");
  this.fileTouched = false;
}

Editor.prototype._render = function _render() {
  if (!this.contents.text.trim()) return "<em>(empty file)</em>";
  return "<pre>" + escapeHtml(this.contents.text) + "</pre>";
};

Editor.prototype.handleReply = function handleReply(msg) {
  this.message.idPromise.then(function (id) {
    if (this.detached) return;
    if (msg.reply.id != id) return;
    try {
      this.chunks[msg.id] = this.contents.findAcquire(msg.text);
    } catch (e) {
      this.reply.html("%s", e.message);
    }
  }.bind(this));
};

Editor.prototype.handleEdit = function handleEdit(msg) {
  if (this.detached) return false;
  if (!Object.hasOwnProperty.call(this.chunks, msg.id)) return false;
  this.contents.modify(this.chunks[msg.id], msg.text);
  this.attemptSave();
  return true;
};

Editor.prototype.attemptSave = function attemptSave() {
  this.fileTouched = true;
  process.nextTick(function () {
    if (!this.fileTouched) return;
    if (this.detached) return;
    this.fileTouched = false;

    // TODO: check for file external modification, fail then
    try {
      fs.writeFileSync(this.file, this.contents.text, this.encoding);
    } catch (e) {
      this.reply.html("Couldn't save file: %s", e.message);
      return;
    }
    this.message.edit(this._render());
  }.bind(this));
};

Editor.prototype.detach = function detach() {
  this.detached = true;
};

module.exports.Editor = Editor;
