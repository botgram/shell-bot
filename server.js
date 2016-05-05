#!/usr/bin/env node
// Starts the bot, handles permissions and chat context,
// interprets commands and delegates the actual command
// running to a Command instance. When started, an owner
// ID should be given.
//
// Usage: ./server.js <auth token> <username>

var botgram = require("botgram");
var utils = require("./lib/utils");
var command = require("./lib/command");

var bot = botgram(process.argv[2]);
var owner = parseInt(process.argv[3]);
var granted = [];
var contexts = {};

bot.all(function (msg, reply, next) {
  if (!(msg.chat.id === owner || granted.indexOf(msg.chat.id) !== -1)) return;

  if (!contexts[id]) contexts[id] = {
    env: utils.getSanitizedEnv(),
  };

  msg.context = contexts[id];
  next();
});

// Replies
bot.message(function (msg, reply, next) {
  if (msg.reply === undefined) return next();
  if (msg.context.command) {
    var command = msg.context.command;
    return reply.reply(command.initialMessage.id || msg).text("A command is already running.");
  }

  msg.context.command.handleReply(msg);
});

// Command start
bot.command("run", function (msg, reply, next) {
  var args = msg.args(1);
  if (msg.context.command) {
    var command = msg.context.command;
    return reply.reply(command.initialMessage.id || msg).text("A command is already running.");
  }

  msg.context.command = new command.Command(reply, context, args[0]);
});


bot.command(function (msg, reply, next) {
  reply.reply(msg).text("Invalid command.");
});
