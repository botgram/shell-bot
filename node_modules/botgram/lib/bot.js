// Entry point for the library. Implements the bot object,
// get / set, lifecycle management, API calling and the
// `getUpdates` loop.
var util = require("util");
var utils = require("./utils");
var EventEmitter = require("events").EventEmitter;
var FormData = require("form-data");

var model = require("./model");
var misc = require("./misc");
var message = require("./message");
var inline = require("./inline");
var reply = require("./reply");
var callback = require("./callback");


/* Network / HTTP error when making the request to the API,
   or an unparseable response was found. */
function NetworkError(err, req) {
  var temp = Error.call(this, req.method + " failed: " + err);
  temp.name = this.name = "NetworkError";
  this.stack = temp.stack;
  this.message = temp.message;
  this.err = err;
  this.req = req;

  var params = util.inspect(this.req.parameters, { depth: 1 });
  this.req.message = util.format("When calling method %s: %s", this.req.method, params);
  this.stack += "\n" + this.req.stack.toString().substring(7);
}
NetworkError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: NetworkError,
    writable: true,
    configurable: true
  }
});

/* Normal response from the API indicating the request failed. */
function TelegramError(err, req) {
  var temp = Error.call(this, req.method + " failed: " + err.description);
  temp.name = this.name = "TelegramError";
  this.stack = temp.stack;
  this.message = temp.message;
  this.err = err;
  this.req = req;

  var params = util.inspect(this.req.parameters, { depth: 1 });
  this.req.message = util.format("When calling method %s: %s", this.req.method, params);
  this.stack += "\n" + this.req.stack.toString().substring(7);
}
TelegramError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: TelegramError,
    writable: true,
    configurable: true
  }
});


function Bot(authToken, options) {
  if (!(this instanceof Bot)) return new Bot(authToken, options);
  EventEmitter.call(this);

  if (options === undefined) options = {};
  if (options.timeout === undefined) options.timeout = 10 * 60;
  if (options.strict === undefined) options.strict = false;
  if (options.autodetect === undefined) options.autodetect = true;
  if (options.retryInterval === undefined) options.retryInterval = 2000;
  if (options.immediate === undefined) options.immediate = false;
  if (options.ignoreUnknown === undefined) options.ignoreUnknown = true;

  if (!utils.isStr(authToken)) throw new Error("Invalid auth token specified");

  this.options = options;
  this.authToken = authToken;
  this.data = {};

  message.initMessage.call(this);
  inline.initInline.call(this);
  misc.initMisc.call(this);
  reply.initReply.call(this);
  callback.initCallback.call(this);

  process.nextTick(firstDetection.bind(this));
}

util.inherits(Bot, EventEmitter);

Bot.prototype.get = function get(name) {
  return this.data[name];
};

Bot.prototype.set = function set(name, value) {
  this.data[name] = value;
};

Bot.prototype.callMethod = function (method, parameters, cb) {
  if (cb === undefined) cb = parameters, parameters = {};

  // Capture the current stack trace in an Error, just in case something goes wrong
  var reqError = new Error();
  reqError.method = method;
  reqError.parameters = parameters;

  // Prepare the body
  var form = new FormData(), setPlaceholder = true;
  form.on("error", handleResponse);
  Object.keys(parameters).forEach(function (key) {
    var value = parameters[key];
    if (value === null || value === undefined) return;
    setPlaceholder = false;

    if (utils.isNum(value) || utils.isBool(value) || utils.isStr(value))
      return form.append(key, value.toString());
    if (utils.isBuffer(value) || utils.isReadable(value))
      return form.append(key, value, value.options);
    form.append(key, JSON.stringify(value));
  });
  if (setPlaceholder) form.append("placeholder", "placeholder");

  // Make the request
  form.submit({
    agent: this.options.agent,
    protocol: "https:",
    host: "api.telegram.org",
    path: "/bot" + this.authToken + "/" + method,
    headers: { accept: "application/json" }
  }, handleResponse);

  // Parse the response
  function handleResponse(err, res) {
    if (err) return cb(new NetworkError(err, reqError));

    if (res.headers["content-type"] !== "application/json") {
      res.resume();
      return cb(new NetworkError("API response not in JSON, " + res.statusCode + " " + res.statusMessage, reqError));
    }

    var chunks = [];
    res.on("error", handleResponse);
    res.on("readable", function () {
      var chunk = res.read();
      if (chunk) chunks.push(chunk);
    });
    res.on("end", function () { handleBody(Buffer.concat(chunks), res.statusCode); });
  }

  function handleBody(body, status) {
    try {
      body = JSON.parse(body);
    } catch (err) { return cb(new NetworkError("Couldn't parse JSON: " + err, reqError)); }
    if (!utils.isBool(body.ok))
      return cb(new NetworkError("ok field not a boolean in API response", reqError));
    if (body.ok !== (status === 200))
      return cb(new NetworkError("ok field not matching JSON response", reqError));
    if (body.ok) return cb(null, body.result);
    cb(new TelegramError(body, reqError));
  }
};

Bot.prototype.autodetect = function autodetect(cb) {
  if (!cb) cb = function () {};
  this.callMethod("getMe", function (err, result) {
    if (err) return cb(err);

    this.set("id", result.id);
    this.set("username", result.username);
    this.set("firstname", result.first_name);
    this.set("lastname", result.last_name);
    cb();
  }.bind(this));
};

function firstDetection() {
  if (this.stopped) return;

  if (this.options.autodetect)
    return this.autodetect(function (err) {
      if (err) {
        this.emit("error", err);
        return setTimeout(firstDetection.bind(this), this.options.retryInterval);
      }
      startLoop.call(this);
    }.bind(this));

  if (!utils.isInt(this.get("id"))) {
    this.emit("error", new Error("Bot was not initialized!"));
    return;
  }
  startLoop.call(this);
}

function startLoop() {
  if (this.stopped) return;
  this.emit("ready");
  consumeUpdates.call(this);
}

function consumeUpdates() {
  this.callMethod("getUpdates", {
    offset: this.offset,
    timeout: this.firstCycleDone ? this.options.timeout : 0,
  }, function (err, result) {
    if (this.stopped) return;
    if (err) {
      this.emit("updateError", err);
      return setTimeout(consumeUpdates.bind(this), this.options.retryInterval);
    }

    // At this point previous updates have been marked as consumed
    if (!this.firstCycleDone && result.length == 0) {
      this.firstCycleDone = true;
      this.emit("synced");
    }

    // Process batch of updates and repeat
    result.forEach(this.processUpdate.bind(this));
    consumeUpdates.call(this);
  }.bind(this));
}

Bot.prototype.ready = function ready(cb) {
  if (utils.isInt(this.get("id")))
    return cb();
  this.on("ready", cb);
};

Bot.prototype.synced = function synced(cb) {
  if (this.firstCycleDone)
    return cb();
  this.on("synced", cb);
};

Bot.prototype.stop = function stop() {
  if (this.stopped) return;
  this.stopped = true;
  this.emit("stopped");
};

Bot.prototype.processUpdate = function processUpdate(update) {
  var id = utils.checkInt(update.update_id);
  delete update.update_id;
  if (this.options.strict && this.offset !== undefined && this.offset !== id)
    throw new Error("Non-sequential update IDs found!");
  this.offset = id + 1;
  var result;

  if (update.message !== undefined) {
    result = this.processMessage(update.message);
    delete update.message;
  } else if (update.edited_message !== undefined) {
    result = this.processMessage(update.edited_message, true);
    delete update.edited_message;
  } else if (update.channel_post !== undefined) {
    result = this.processMessage(update.channel_post, false, true);
    delete update.channel_post;
  } else if (update.edited_channel_post !== undefined) {
    result = this.processMessage(update.edited_channel_post, true, true);
    delete update.edited_channel_post;
  } else if (update.inline_query !== undefined) {
    result = this.processInlineQuery(update.inline_query);
    delete update.inline_query;
  } else if (update.chosen_inline_result !== undefined) {
    result = this.processChosenInlineResult(update.chosen_inline_result);
    delete update.chosen_inline_result;
  } else if (update.callback_query !== undefined) {
    result = this.processCallbackQuery(update.callback_query);
    delete update.callback_query;
  } else if (this.options.strict) {
    throw new Error("Unknown update type!");
  }

  if (this.options.strict && Object.keys(update).length > 0)
    throw new Error("Unknown fields in update");
  return result;
};



Object.keys(model).forEach(function (k) {
  Bot[k] = model[k];
});
Bot.ReplyQueue = reply.ReplyQueue;
Bot.NetworkError = NetworkError;
Bot.TelegramError = TelegramError;
module.exports = Bot;
