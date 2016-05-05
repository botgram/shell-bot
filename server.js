#!/usr/bin/env node
// Starts the bot, handles permissions and chat context,
// interprets commands and delegates the actual command
// running to a Command instance. When started, an owner
// ID should be given.
//
// Usage: ./server.js <auth token> <ID>

var botgram = require("../..");
var escapeHtml = require("escape-html");
var utils = require("./lib/utils");
var Command = require("./lib/command").Command;

var bot = botgram(process.argv[2]);
var owner = parseInt(process.argv[3]);
var granted = {};
var contexts = {};
var defaultCwd = process.env.HOME || process.cwd();

bot.all(function (msg, reply, next) {
  var id = msg.chat.id;
  if (!(id === owner || granted[id])) return;

  if (!contexts[id]) contexts[id] = {
    shell: process.env.SHELL, //FIXME: add process.env.SHELL to list of shells, as first option, if it wasn't there already, otherwise move to first option
    env: utils.getSanitizedEnv(),
    cwd: defaultCwd,
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

// Signal sending
bot.command("cancel", "kill", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (!msg.context.command)
    return reply.reply("No command is running.");

  var group = msg.command === "cancel";
  var signal = group ? "SIGINT" : "SIGTERM";
  if (arg.trim().length) signal = arg.trim().toUpperCase();
  if (signal.substring(0,3) !== "SIG") signal = "SIG" + signal;
  msg.context.command.sendSignal(signal, group);
});

// Input sending
bot.command("send", function (msg, reply, next) {
  var args = msg.args(1);
  if (!msg.context.command)
    return reply.reply("No command is running.");
  msg.context.command.sendInput(args[0]);
});
bot.command("end", function (msg, reply, next) {
  if (!msg.context.command)
    return reply.reply("No command is running.");
  msg.context.command.sendEof();
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

// Settings: Info
bot.command("info", function (msg, reply, next) {
  var content = "", context = msg.context;

  // Running command
  if (!context.command) content += "No command running.\n\n";
  else content += "Command running, PID "+context.command.pty.pid+".\n\n";

  // Chat settings
  content += "Shell: " + escapeHtml(context.shell) + "\n";
  content += "Size: " + context.size.columns + "x" + context.size.rows + "\n";
  content += "Directory: " + escapeHtml(context.cwd) + "\n";
  content += "Silent: " + (context.silent ? "yes" : "no") + "\n";
  var uid = process.getuid(), gid = process.getgid();
  if (uid !== gid) uid = uid + "/" + gid;
  content += "UID/GID: " + uid + "\n";
  //FIXME: possible feature: restrict chats to UIDs

  // Granted chats
  if (msg.chat.id === owner) {
    var grantedIds = Object.keys(granted);
    if (grantedIds.length) {
      content += "\nGranted chats:\n";
      content += grantedIds.map(function (id) { return id.toString(); }).join("\n");
    } else {
      content += "\nNo chats granted. Use /grant to allow another chat to use the bot.";
    }
  }

  if (context.command) reply.reply(context.command.initialMessage.id);
  reply.html(content);
});

// Settings: Shell
bot.command("shell", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (arg.trim().length) {
    if (msg.context.command) {
      var command = msg.context.command;
      return reply.reply(command.initialMessage.id || msg).text("Can't change the shell while a command is running running.");
    }
    //FIXME: resolve shell, validate if not found in list
    msg.context.shell = arg;
    reply.html("Shell changed.");
  } else {
    var shell = msg.context.shell;
    var otherShells = utils.shells.slice(0);
    var idx = otherShells.indexOf(shell);
    if (idx !== -1) otherShells.splice(idx, 1);

    var content = "Current shell: " + escapeHtml(shell);
    if (otherShells.length)
      content += "\n\nOther shells:\n" + otherShells.map(escapeHtml).join("\n");
    reply.html(content);
  }
});

// Settings: Environment
bot.command("env", function (msg, reply, next) {
  //TODO
});

// Settings: Size
bot.command("resize", function (msg, reply, next) {
  // TODO
});

// Settings: Silent
bot.command("setsilent", function (msg, reply, next) {
  // TODO
});

// Settings: Grant
bot.command("grant", "revoke", function (msg, reply, next) {
  var arg = msg.args(1)[0], id = parseInt(arg);
  if (arg.trim().length === 0 || id === NaN)
    return reply.text("Use /grant <id> or /revoke <id> to control whether the chat with that ID can use this bot.");
  reply.reply(msg);
  if (msg.command === "grant") {
    granted[id] = true;
    reply.html("Chat " + id + " can now use this bot. Use /revoke to undo.");
  } else {
    if (contexts[id] && contexts[id].command)
      return reply.html("Couldn't revoke specified chat because a command is running.");
    delete granted[id];
    delete contexts[id];
    reply.html("Chat " + id + " has been revoked successfully.");
  }
});

// Help
bot.command("help", function (msg, reply, next) {
  reply.html(
    "Use /run &lt;command&gt; and I'll execute it for you. While it's running, you can:\n" +
    "\n" +
    " ‣ Reply to one of my messages to send input to the command, or use /send.\n" +
    " ‣ Use /end to send an EOF (Ctrl+D) to the command.\n" +
    " ‣ Use /cancel to send SIGINT (Ctrl+C) to the process group, or the signal you choose.\n" +
    " ‣ Use /kill to send SIGTERM to the root process, or the signal you choose.\n" + 
    "\n" +
    "You can see the current status and settings for this chat with /info. Use /shell to see or " +
    "change the shell used to run commands, /resize to change the size of the terminal, " +
    "/env to manipulate the environment, and /setsilent to enable or disable notifications " +
    "for messages from the command."
  );
});


bot.command(function (msg, reply, next) {
  reply.reply(msg).text("Invalid command.");
});
