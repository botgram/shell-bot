// Inline query facility. This handles incoming updates related
// to inline bot queries, and query answering.

//var utils = require("./utils");

var model = require("./model");

// Entry point for the inline facility. This initializes everything
// and registers the processInlineQuery method so we can be called to
// process queries as they arrive.
function initInline() {
  // Export processInlineQuery and processChosenInlineResult so we can be called
  this.processInlineQuery = processInlineQuery;
  this.processChosenInlineResult = processChosenInlineResult;

  // User facing API
  this.query = function query(handler) {
    this.inlineQueryHandler = handler;
  };
  this.chosenResult = function chosenResult(handler) {
    this.chosenInlineResultHandler = handler;
  };
}

function processInlineQuery(query) {
  if (!this.inlineQueryHandler) return;
  query = new model.InlineQuery().parse(query, this.options);
  query.queued = !this.firstCycleDone;
  // TODO: set query.answer

  return this.inlineQueryHandler.call(this, query);
}

function processChosenInlineResult(choice) {
  if (!this.chosenInlineResultHandler) return;
  choice = new model.ChosenInlineResult().parse(choice, this.options);
  choice.queued = !this.firstCycleDone;

  return this.chosenInlineResultHandler.call(this, choice);
}



exports.initInline = initInline;
