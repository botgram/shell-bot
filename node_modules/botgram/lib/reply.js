// Implements reply queues and message sending in general.

var util = require("util");
var escapeHtml = require("escape-html");
var utils = require("./utils");
var model = require("./model");

// Entry point for the reply queues facility.
// Each reply queue is a queue of actions, where each action is
// a function accepting a callback to call when it finishes.

function initReply() {
  // A queue is implemented with a single-linked list, where
  // `this.queues[id]` points to the head of the queue, aka the
  // last action that was queued. The head is empty only if no
  // action is being executed, or queued.
  this.queues = {};

  // User-facing API to get a reply queue externally
  this.reply = getReplyQueue;

  // Timers for chat actions
  this.chatActionTimers = {};
}

// Core logic that enqueues an action to a reply queue, starting
// the queue if it was empty, and handles dequeuing of actions as
// they finish executing.

function callAction(id, action) {
  return action.call(this, nextAction.bind(this, id, action));
}

function enqueue(id, action) {
  if (this.options.immediate)
    return action.call(this, function () {});

  // New action becomes the head of the queue
  var previousAction = this.queues[id];
  this.queues[id] = action;

  if (previousAction === undefined) {
    // Queue was empty, start it by calling the action!
    return callAction.call(this, id, action);
  } else {
    // Queue was running, just enqueue action
    previousAction.next = action;
  }
}

function nextAction(id, action) {
  if (action.next) return callAction.call(this, id, action.next);

  // No more actions to run, delete head to mark queue as idle.
  delete this.queues[id];
}

// Notice the queues have no way of signaling failure. The following
// code wraps an action so that it may call `next` with an error object.
// In this case, the user callback will be called if it was registered,
// or an `error` event will be emitted.

function enqueueError(id, action) {
  var realAction = function enqueueError(next) {
    action.call(this, function enqueueError(err, result) {
      if (realAction.then) realAction.then.call(this, err, result, next);
      else if (err) this.emit("error", err);
      return next();
    }.bind(this));
  };
  return enqueue.call(this, id, realAction);
}

// The reply queue 'object' has the user-facing API and embedded queue
// ID and bot object so the user doesn't have to pass that everytime.

function ReplyQueue(bot, id) {
  this.bot = bot;
  this.id = id;
  this.parameters = {};
}

function getReplyQueue(chat) {
  return new ReplyQueue(this, model.resolveChat(chat));
}

ReplyQueue.prototype.to = function to(chat) {
  return this.bot.reply(chat);
};

ReplyQueue.prototype.sendGeneric = function sendGeneric(method, additionalParameters, parseFunction) {
  var parameters = this.parameters;
  this.parameters = {};
  parameters.chat_id = this.id;
  Object.keys(additionalParameters).forEach(function (key) {
    parameters[key] = additionalParameters[key];
  });

  if (!parseFunction) parseFunction = function parseMessage(result) {
    return new model.Message().parse(result, this.bot.options);
  }.bind(this);

  enqueueError.call(this.bot, this.id, function action(next) {
    this.bot.callMethod(method, parameters, function callback(err, result) {
      if (err) return next(err, result);
      return next(err, parseFunction(result));
    }.bind(this));
  }.bind(this));
  return this;
};

ReplyQueue.prototype.then = function then(cb) {
  if (cb === undefined) return utils.promiseInvoke(this.then, this);
  var action = this.bot.queues[this.id];
  if (action === undefined || action.then !== undefined)
    throw new Error("reply.then must be called only once, and after an action is enqueued");
  action.then = cb;
  return this;
};

function expectTrue(result) {
  if (result !== true) throw new Error("Expected true");
}

// Basic methods, for sending simple messages

function resolveFile(file) {
  if (utils.isBuffer(file) || utils.isReadable(file)) return file;
  return model.resolveFile(file);
}

ReplyQueue.prototype.forward = function forward(id, chat) {
  if (id instanceof model.Message) {
    chat = id.chat;
    id = id.id;
  }
  chat = model.resolveChat(chat);
  return this.sendGeneric("forwardMessage", {message_id: id, from_chat_id: chat});
};

ReplyQueue.prototype.text = function text(text, mode) {
  return this.sendGeneric("sendMessage", {text: text, parse_mode: mode});
};

ReplyQueue.prototype.markdown = function markdown(text) {
  return this.text(text, "Markdown");
};

ReplyQueue.prototype.html = function html(text) {
  var args = Array.prototype.slice.call(arguments, 1).map(function (arg) {
    return escapeHtml(arg.toString());
  });
  args.unshift(text);
  return this.text(util.format.apply(util, args), "HTML");
};

ReplyQueue.prototype.photo = function photo(file, caption, captionMode) {
  file = resolveFile(file);
  return this.sendGeneric("sendPhoto", {photo: file, caption: caption, parse_mode: captionMode});
};

ReplyQueue.prototype.audio = function audio(file, duration, performer, title, caption, captionMode) {
  file = resolveFile(file);
  return this.sendGeneric("sendAudio", {audio: file, duration: duration, performer: performer, title: title, caption: caption, parse_mode: captionMode});
};

ReplyQueue.prototype.document = function document(file, caption, captionMode) {
  file = resolveFile(file);
  return this.sendGeneric("sendDocument", {document: file, caption: caption, parse_mode: captionMode});
};

ReplyQueue.prototype.sticker = function sticker(file) {
  file = resolveFile(file);
  return this.sendGeneric("sendSticker", {sticker: file});
};

ReplyQueue.prototype.video = function video(file, duration, width, height, caption, captionMode, streaming) {
  file = resolveFile(file);
  return this.sendGeneric("sendVideo", {video: file, duration: duration, caption: caption, parse_mode: captionMode, width: width, height: height, supports_streaming: streaming});
};

ReplyQueue.prototype.videoNote = function videoNote(file, duration, length) {
  file = resolveFile(file);
  return this.sendGeneric("sendVideoNote", {video_note: file, duration: duration, length: length});
};

ReplyQueue.prototype.voice = function voice(file, duration, caption, captionMode) {
  file = resolveFile(file);
  return this.sendGeneric("sendVoice", {voice: file, duration: duration, caption: caption, parse_mode: captionMode});
};

ReplyQueue.prototype.location = function location(latitude, longitude) {
  return this.sendGeneric("sendLocation", {latitude: latitude, longitude: longitude});
};

ReplyQueue.prototype.venue = function venue(latitude, longitude, title, address, foursquareId) {
  return this.sendGeneric("sendVenue", {latitude: latitude, longitude: longitude, title: title, address: address, foursquare_id: foursquareId});
};

ReplyQueue.prototype.contact = function contact(phone, firstname, lastname) {
  return this.sendGeneric("sendContact", {phone_number: phone, first_name: firstname, last_name: lastname});
};

ReplyQueue.prototype.game = function game(gameShortName) {
  return this.sendGeneric("sendGame", {game_short_name: gameShortName});
};

ReplyQueue.prototype.command = function command(explicit, command) {
  var args = Array.prototype.slice.call(arguments);
  explicit = args.shift();
  if (typeof explicit !== "boolean") {
    command = explicit;
    explicit = this.id < 0;
  } else command = args.shift();
  if (args[0] instanceof Array) args = args[0];
  return this.text(this.bot.formatCommand(explicit, command, args));
};

ReplyQueue.prototype.message = function message(msg, reforward) {
  if (reforward && msg.forward) return this.forward(msg);
  if (msg.type === "text") return this.text(msg.text);
  if (msg.type === "audio") return this.audio(msg.file, msg.duration, msg.performer, msg.title);
  if (msg.type === "document") return this.document(msg.file);
  if (msg.type === "photo") return this.photo(msg.image.file, msg.caption);
  if (msg.type === "sticker") return this.sticker(msg.file);
  if (msg.type === "video") return this.video(msg.file, msg.duration, msg.width, msg.height, msg.caption);
  if (msg.type === "videoNote") return this.videoNote(msg.file, msg.duration, msg.length);
  if (msg.type === "voice") return this.voice(msg.file, msg.duration);
  if (msg.type === "location") return this.location(msg.latitude, msg.longitude);
  if (msg.type === "venue") return this.venue(msg.latitude, msg.longitude, msg.title, msg.address, msg.foursquareId);
  if (msg.type === "contact") return this.contact(msg.phone, msg.firstname, msg.lastname);
  if (msg.type === "game") throw new Error("Can't resend game messages");
  if (msg.type === "update") throw new Error("Updates cannot be resent");
  throw new Error("Unknown message");
};

// Modifiers

ReplyQueue.prototype.reply = function reply(msg) {
  if (msg) msg = model.resolveMessage(msg);
  else msg = undefined;
  this.parameters["reply_to_message_id"] = msg;
  return this;
};

ReplyQueue.prototype.selective = function selective(selective) {
  if (selective === undefined) selective = true;
  if (!this.parameters["reply_markup"]) this.parameters["reply_markup"] = {};
  var markup = this.parameters["reply_markup"];

  markup.selective = selective;
  return this;
};

ReplyQueue.prototype.forceReply = function forceReply(force) {
  if (force === undefined) force = true;
  if (!this.parameters["reply_markup"]) this.parameters["reply_markup"] = {};
  var markup = this.parameters["reply_markup"];

  markup.force_reply = force;
  return this;
};

ReplyQueue.prototype.keyboard = function keyboard(keys, resize, oneTime) {
  if (!this.parameters["reply_markup"]) this.parameters["reply_markup"] = {};
  var markup = this.parameters["reply_markup"];

  if (!keys) {
    delete markup.keyboard;
    delete markup.resize_keyboard;
    delete markup.one_time_keyboard;
    if (keys === null) delete markup.remove_keyboard;
    else markup.remove_keyboard = true;
    return this;
  }

  delete markup.remove_keyboard;
  markup.keyboard = model.formatKeyboard(keys);
  markup.resize_keyboard = !!resize;
  markup.one_time_keyboard = !!oneTime;
  return this;
};

ReplyQueue.prototype.inlineKeyboard = function inlineKeyboard(keys) {
  if (!this.parameters["reply_markup"]) this.parameters["reply_markup"] = {};
  var markup = this.parameters["reply_markup"];

  if (!keys) {
    delete markup.inline_keyboard;
    return this;
  }

  markup.inline_keyboard = keys;
  return this;
};

ReplyQueue.prototype.disablePreview = function disablePreview(disable) {
  if (disable === undefined) disable = true;
  this.parameters["disable_web_page_preview"] = disable;
  return this;
};

ReplyQueue.prototype.silent = function silent(silent) {
  if (silent === undefined) silent = true;
  this.parameters["disable_notification"] = silent;
  return this;
};

// Other actions

ReplyQueue.prototype.action = function action(action) {
  if (action === undefined) action = "typing";
  return this.sendGeneric("sendChatAction", {action: action}, expectTrue);
};

ReplyQueue.prototype.editText = function editText(msg, text, mode) {
  var parameters = {text: text, parse_mode: mode}, parseFunction;
  if (utils.isStr(msg)) {
    parameters.inline_message_id = msg;
    parseFunction = expectTrue;
  } else {
    parameters.message_id = model.resolveMessage(msg);
  }
  return this.sendGeneric("editMessageText", parameters, parseFunction);
};

ReplyQueue.prototype.editMarkdown = function editMarkdown(msg, text) {
  return this.editText(msg, text, "Markdown");
};

ReplyQueue.prototype.editHTML = function editHTML(msg, text) {
  var args = Array.prototype.slice.call(arguments, 2).map(function (arg) {
    return escapeHtml(arg.toString());
  });
  args.unshift(text);
  return this.editText(msg, util.format.apply(util, args), "HTML");
};

ReplyQueue.prototype.editCaption = function editCaption(msg, caption) {
  var parameters = {caption: caption}, parseFunction;
  if (utils.isStr(msg)) {
    parameters.inline_message_id = msg;
    parseFunction = expectTrue;
  } else {
    parameters.message_id = model.resolveMessage(msg);
  }
  return this.sendGeneric("editMessageCaption", parameters, parseFunction);
};

ReplyQueue.prototype.editReplyMarkup = function editReplyMarkup(msg) {
  var parameters = {}, parseFunction;
  if (utils.isStr(msg)) {
    parameters.inline_message_id = msg;
    parseFunction = expectTrue;
  } else {
    parameters.message_id = model.resolveMessage(msg);
  }
  return this.sendGeneric("editMessageReplyMarkup", parameters, parseFunction);
};

ReplyQueue.prototype.deleteMessage = function deleteMessage(msg) {
  var parameters = { message_id: model.resolveMessage(msg) };
  return this.sendGeneric("deleteMessage", parameters, expectTrue);
};



exports.initReply = initReply;
exports.ReplyQueue = ReplyQueue;
