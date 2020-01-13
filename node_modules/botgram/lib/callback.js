// Callback query facility. This handles incoming callback queries.

var utils = require("./utils");

var model = require("./model");

// Entry point for the callback query facility. This initializes everything
// and registers the processCallbackQuery method so we can be called to
// process queries as they arrive.
function initCallback() {
  // Create handler queue, reexport methods
  this.callbackHandlerQueue = new CallbackHandlerQueue();
  Object.keys(CallbackHandlerQueue.prototype).forEach(function (key) {
    this[key] = CallbackHandlerQueue.prototype[key].bind(this.callbackHandlerQueue);
  }, this);

  // Export processCallbackQuery so we can be called
  this.processCallbackQuery = processCallbackQuery;
}

function processCallbackQuery(query) {
  query = new model.CallbackQuery().parse(query, this.options);
  query.queued = !this.firstCycleDone;
  query.answer = answer.bind(this, query);
  return callHandler.call(this.callbackHandlerQueue, this, 0, query, function () {});
}

function answer(query, options, callback) {
  if (query instanceof model.CallbackQuery) query = query.id;
  utils.checkStr(query);
  if (options === undefined) options = {};

  return this.callMethod("answerCallbackQuery", {
    callback_query_id: query,
    text: options.text,
    show_alert: options.alert,
    url: options.url,
    cache_time: options.cacheTime,
  }, callback || function (err, result) {
    if (err) throw err;
    if (result !== true) throw new Error("Expected true");
  });
}

// Core logic that holds the handlers and calls them in order.

function CallbackHandlerQueue() {
  this.handlers = [];
}

function callHandler(bot, i, query, next) {
  if (i < this.handlers.length)
    return this.handlers[i].call(bot, query, callHandler.bind(this, bot, i+1, query, next));
  return next();
}

// Handler registers: this is the user-facing API.

CallbackHandlerQueue.prototype.callback = function callback(handler) {
  this.handlers.push(handler);
  return this;
};



exports.initCallback = initCallback;
exports.CallbackHandlerQueue = CallbackHandlerQueue;
