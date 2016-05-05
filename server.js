#!/usr/bin/env node
// Starts the bot, handles permissions and chat context,
// interprets commands and delegates the actual command
// running to a Command instance. When started, an owner
// ID should be given.
//
// Usage: ./server.js <auth token> <username>

var botgram = require("botgram");
var utils = require("./lib/utils");
var Command = require("./lib/command").Command;

var bot = botgram(process.argv[2]);
var owner = parseInt(process.argv[3]);
var granted = [];
var contexts = {};

bot.all(function (msg, reply, next) {
  var id = msg.chat.id;
  if (!(id === owner || granted.indexOf(id) !== -1)) return;

  if (!contexts[id]) contexts[id] = {
    shell: process.env.SHELL, //FIXME: add process.env.SHELL to list of shells, as first option, if it wasn't there already, otherwise move to first option
    env: utils.getSanitizedEnv(),
    cwd: process.cwd(), //FIXME: try process.HOME first
    size: {columns: 80, rows: 24},
    silent: true,
  };

  msg.context = contexts[id];
  next();
});

// Replies
bot.message(function (msg, reply, next) {
  if (msg.reply === undefined) return next();
  if (!msg.context.command)
    return reply.reply("No command is running.");
  msg.context.command.handleReply(msg);
});

// Command start
bot.command("run", function (msg, reply, next) {
  var args = msg.args(1);
  if (msg.context.command) {
    var command = msg.context.command;
    return reply.reply(command.initialMessage.id || msg).text("A command is already running.");
  }

  msg.context.command = new Command(reply, msg.context, args[0]);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});


bot.command(function (msg, reply, next) {
  reply.reply(msg).text("Invalid command.");
});
