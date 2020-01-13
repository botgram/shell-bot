// Message facility. This handles incoming messages and message
// edits, calling registered handlers in order.

var utils = require("./utils");
var Minimatch = require("minimatch").Minimatch;

var model = require("./model");

// Entry point for the message facility. This initializes everything
// and registers the processMessage method so we can be called to
// process messages as they arrive.
function initMessage() {
  // Create handler queue, reexport methods
  this.handlerQueue = new HandlerQueue();
  Object.keys(HandlerQueue.prototype).forEach(function (key) {
    this[key] = HandlerQueue.prototype[key].bind(this.handlerQueue);
  }, this);

  // Create special handler queue for edits
  this.edited = new HandlerQueue();

  // Export processMessage so we can be called
  this.processMessage = processMessage;
}

function processMessage(message, edited, channel) {
  try {
    message = new model.Message().parse(message, this.options);
    if ((message.chat.type === "channel") !== !!channel)
      throw new Error("Channel message not consistent with update source");
  } catch (err) {
    this.emit("error", err);
    return;
  }

  var reply = this.reply(message.chat.id);

  message.queued = !this.firstCycleDone;
  if (edited) message.edited = true;
  if (message.command) {
    if (message.username) {
      message.mine = utils.equalsIgnoreCase(message.username, this.get("username"));
      message.exclusive = message.mine;
    } else {
      message.mine = true;
      message.exclusive = (message.chat.type === "user");
    }
  }

  if (message.type === undefined && this.options.ignoreUnknown) return;
  var queue = edited ? this.edited : this.handlerQueue;
  return callHandler.call(queue, this, 0, message, reply, function () {});
}

// Core logic that holds the handlers and calls them in order.

function HandlerQueue() {
  this.handlers = [];
}

function callHandler(bot, i, msg, reply, next) {
  if (i < this.handlers.length)
    return this.handlers[i].call(bot, msg, reply, callHandler.bind(this, bot, i+1, msg, reply, next));
  return next();
}

// This utility helps generate handler registers.
// It takes a function that will be called with an
// `args` array, containing all parameters passed
// on registration except the handler. That function
// will return a filter function, that given a message
// object returns `true` if the message should be
// processed, or `false` otherwise.

function wrapArgs(generateFilter) {
  return function wrapArgs() {
    // Parse arguments
    if (arguments.length < 1) throw new Error("Handler must be provided");
    var args = Array.prototype.slice.call(arguments);
    var handler = args.pop();
    if (!utils.isFunc(handler)) throw new Error("Handler must be a function");

    // Register handler
    var filter = generateFilter.call(this, args);
    this.handlers.push(function (msg, reply, next) {
      if (!filter.call(this, msg)) return next();
      return handler.call(this, msg, reply, next);
    });
  };
}

// Handler registers: this is the user-facing API.

HandlerQueue.prototype.all = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function all() { return true; };
});

HandlerQueue.prototype.message = wrapArgs(function (args) {
  if (args.length > 1 || (args.length == 1 && !utils.isBool(args[0])))
    throw new Error("Unexpected arguments");
  var alsoUpdates = args.length ? args[0] : false;

  return function message(msg) {
    if (msg.type === undefined) return false;
    if (!alsoUpdates && msg.type === "update") return false;
    return true;
  };
});

HandlerQueue.prototype.text = wrapArgs(function (args) {
  if (args.length > 1 || (args.length == 1 && !utils.isBool(args[0])))
    throw new Error("Unexpected arguments");
  var alsoCommands = args.length ? args[0] : false;

  return function text(msg) {
    if (msg.type !== "text") return false;
    if (!alsoCommands && msg.command) return false;
    return true;
  };
});

HandlerQueue.prototype.mention = wrapArgs(function (args) {
  var alsoCommands = false;
  if (!utils.isBool(args[0])) alsoCommands = args.shift();

  return function mention(msg) {
    if (msg.type !== "text") return false;
    if (!alsoCommands && msg.command) return false;

    var usernames = args.length ? args : [this.get("username")];
    for (var u = 0; u < usernames.length; u++)
      if (msg.mentions(usernames[u])) return true;
  };
});

HandlerQueue.prototype.command = wrapArgs(function (args) {
  if (args.length === 0)
    return function (msg) { return msg.command && msg.mine && msg.exclusive; };
  if (args.length === 1 && utils.isBool(args[0]))
    return function (msg) { return msg.command && msg.mine && (args[0] || msg.exclusive); };

  args.forEach(function (name) {
    if (!(utils.isStr(name) || utils.isRegex(name)))
      throw new Error("Command names must be String or RegExp");
  });
  return function command(msg) {
    if (!(msg.command && msg.mine)) return false;
    for (var n = 0; n < args.length; n++)
      if (utils.isRegex(args[n])) {
        if (args[n].test(msg.command)) return true;
      } else {
        if (utils.equalsIgnoreCase(args[n], msg.command)) return true;
      }
  };
});

HandlerQueue.prototype.audio = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "audio"; };
});

HandlerQueue.prototype.document = wrapArgs(function (args) {
  if (args.length === 0)
    return function (msg) { return msg.type === "document"; };
  args = args.map(function (name) {
    if (name instanceof String) {
      var mm = new Minimatch(name);
      return function (n) { return mm.match(n); };
    }
    if (name instanceof RegExp) {
      return function (n) { return name.test(n); };
    }
    throw new Error("Command names must be String or RegExp");
  });
  return function (msg) {
    if (!(msg.type === "document" && msg.filename)) return false;
    if (args.length === 0) return true;
    for (var n = 0; n < args.length; n++)
      if (args[n](msg.filename)) return true;
  };
});

HandlerQueue.prototype.photo = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "photo"; };
});

HandlerQueue.prototype.sticker = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "sticker"; };
});

HandlerQueue.prototype.video = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "video"; };
});

HandlerQueue.prototype.videoNote = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "videoNote"; };
});

HandlerQueue.prototype.voice = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "voice"; };
});

HandlerQueue.prototype.contact = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "contact"; };
});

HandlerQueue.prototype.location = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "location"; };
});

HandlerQueue.prototype.venue = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "venue"; };
});

HandlerQueue.prototype.game = wrapArgs(function (args) {
  if (args.length) throw new Error("Unexpected arguments");
  return function (msg) { return msg.type === "game"; };
});

HandlerQueue.prototype.update = wrapArgs(function (args) {
  if (args.length > 2) throw new Error("Unexpected arguments");
  var subject = args[0], action = args[1];
  return function (msg) {
    if (msg.type !== "update") return false;
    if (subject && msg.subject !== subject) return false;
    if (action && msg.action !== action) return false;
    return true;
  };
});

// Filters & middleware

HandlerQueue.prototype.context = function context(initial) {
  if (initial === undefined) {
    initial = function () { return {}; };
  } else if (!utils.isFunc(initial)) {
    var initialObj = initial;
    initial = function () { return Object.create(initialObj); };
  }
  this.all(function (msg, reply, next) {
    if (!this.contexts) this.contexts = {};
    var contexts = this.contexts;
    var id = msg.chat.id;
    if (!(id in contexts)) contexts[id] = initial(msg, reply);
    msg.context = contexts[id];
    return next();
  });
};

//TODO:
//.from
//.original
//.forwarded
//.channel
//.group
//.user



exports.initMessage = initMessage;
exports.HandlerQueue = HandlerQueue;
