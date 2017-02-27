#!/usr/bin/env node
// Starts the bot, handles permissions and chat context,
// interprets commands and delegates the actual command
// running to a Command instance. When started, an owner
// ID should be given.

var path = require("path");
var fs = require("fs");
var botgram = require("../..");
var escapeHtml = require("escape-html");
var utils = require("./lib/utils");
var Command = require("./lib/command").Command;

if (process.argv.length !== 4) {
  console.error("Usage: " + process.argv.slice(0,2).join(" ") + " <auth token> <ID>");
  process.exit(1);
}

var bot = botgram(process.argv[2]);
var owner = parseInt(process.argv[3]);
var tokens = {};
var granted = {};
var contexts = {};
var defaultCwd = process.env.HOME || process.cwd();

bot.on("updateError", function (err) {
  console.error("Error when updating:", err);
});

bot.on("ready", function () {
  bot.reply(owner).silent().text("Bot ready.");
});


bot.all(function (msg, reply, next) {
  if (msg.queued) return;

  var id = msg.chat.id;
  var allowed = id === owner || granted[id];

  // If this message contains a token, check it
  if (!allowed && msg.command === "start" && Object.hasOwnProperty.call(tokens, msg.args())) {
    var token = tokens[msg.args()];
    delete tokens[msg.args()];
    granted[id] = true;
    allowed = true;

    // Notify owner
    // FIXME: reply to token message
    var contents = (msg.user ? "User" : "Chat") + " <em>" + escapeHtml(msg.chat.name) + "</em>";
    if (msg.chat.username) contents += " (@" + escapeHtml(msg.chat.username) + ")";
    contents += " can now use the bot. To revoke, use:";
    reply.to(owner).html(contents).command("revoke", id);
  }

  // If chat is not allowed, but user is, use its context
  if (!allowed && (msg.from.id === owner || granted[msg.from.id])) {
    id = msg.from.id;
    allowed = true;
  }

  // Check that the chat is allowed
  if (!allowed) {
    if (msg.command === "start") reply.html("Not authorized to use this bot.");
    return;
  }

  if (!contexts[id]) contexts[id] = {
    id: id,
    shell: utils.shells[0],
    env: utils.getSanitizedEnv(),
    cwd: defaultCwd,
    size: {columns: 40, rows: 20},
    silent: true,
    linkPreviews: false,
  };

  msg.context = contexts[id];
  next();
});


// Replies
bot.message(function (msg, reply, next) {
  if (msg.reply === undefined || msg.reply.from.id !== this.get("id")) return next();
  if (!msg.context.command)
    return reply.html("No command is running.");
  msg.context.command.handleReply(msg);
});

// Signal sending
bot.command("cancel", "kill", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (!msg.context.command)
    return reply.html("No command is running.");

  var group = msg.command === "cancel";
  var signal = group ? "SIGINT" : "SIGTERM";
  if (arg.trim().length) signal = arg.trim().toUpperCase();
  if (signal.substring(0,3) !== "SIG") signal = "SIG" + signal;
  try {
    msg.context.command.sendSignal(signal, group);
  } catch (err) {
    reply.reply(msg).html("Couldn't send signal.");
  }
});

// Input sending
bot.command("enter", "type", function (msg, reply, next) {
  var args = msg.args(1);
  if (!msg.context.command)
    return reply.html("No command is running.");
  if (msg.command === "type" && !args[0]) args[0] = " ";
  msg.context.command.sendInput(args[0], msg.command === "type");
});
bot.command("end", function (msg, reply, next) {
  if (!msg.context.command)
    return reply.html("No command is running.");
  msg.context.command.sendEof();
});

// Redraw
bot.command("redraw", function (msg, reply, next) {
  if (!msg.context.command)
    return reply.html("No command is running.");
  msg.context.command.redraw();
});

// Command start
bot.command("run", function (msg, reply, next) {
  var args = msg.args(1);
  if (!args[0].trim().length)
    return reply.html("Use /run &lt;command&gt; to execute something.");

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.reply(command.initialMessage.id || msg).text("A command is already running.");
  }

  msg.context.command = new Command(reply, msg.context, args[0]);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// Keypad
bot.command("keypad", function (msg, reply, next) {
  if (!msg.context.command)
    return reply.html("No command is running.");
  try {
    msg.context.command.toggleKeypad();
  } catch (e) {
    reply.html("Couldn't toggle keypad.");
  }
});

// Settings
bot.command("settings", function (msg, reply, next) {
  var content = "", context = msg.context;

  // Running command
  if (!context.command) content += "No command running.\n\n";
  else content += "Command running, PID "+context.command.pty.pid+".\n\n";

  // Chat settings
  content += "Shell: " + escapeHtml(context.shell) + "\n";
  content += "Size: " + context.size.columns + "x" + context.size.rows + "\n";
  content += "Directory: " + escapeHtml(context.cwd) + "\n";
  content += "Silent: " + (context.silent ? "yes" : "no") + "\n";
  content += "Link previews: " + (context.linkPreviews ? "yes" : "no") + "\n";
  var uid = process.getuid(), gid = process.getgid();
  if (uid !== gid) uid = uid + "/" + gid;
  content += "UID/GID: " + uid + "\n";

  // Granted chats (msg.chat.id is intentional)
  if (msg.chat.id === owner) {
    var grantedIds = Object.keys(granted);
    if (grantedIds.length) {
      content += "\nGranted chats:\n";
      content += grantedIds.map(function (id) { return id.toString(); }).join("\n");
    } else {
      content += "\nNo chats granted. Use /grant or /token to allow another chat to use the bot.";
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
      return reply.reply(command.initialMessage.id || msg).html("Can't change the shell while a command is running.");
    }
    try {
      var shell = utils.resolveShell(shell);
      msg.context.shell = shell;
      reply.html("Shell changed.");
    } catch (err) {
      reply.html("Couldn't change the shell.");
    }
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

// Settings: Working dir
bot.command("cd", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (arg.trim().length) {
    if (msg.context.command) {
      var command = msg.context.command;
      return reply.reply(command.initialMessage.id || msg).html("Can't change directory while a command is running.");
    }
    var newdir = path.resolve(msg.context.cwd, arg);
    try {
      fs.readdirSync(newdir);
      msg.context.cwd = newdir;
    } catch (err) {
      return reply.html("%s", err);
    }
  }
  reply.html("Now at: %s", msg.context.cwd);
});

// Settings: Environment
bot.command("env", function (msg, reply, next) {
  var env = msg.context.env, key = msg.args();
  if (!key)
    return reply.reply(msg).html("Use %s to see the value of a variable, or %s to change it.", "/env <name>", "/env <name>=<value>");

  var idx = key.indexOf("=");
  if (idx === -1) idx = key.indexOf(" ");

  if (idx !== -1) {
    if (msg.context.command) {
      var command = msg.context.command;
      return reply.reply(command.initialMessage.id || msg).html("Can't change the environment while a command is running.");
    }

    var value = key.substring(idx + 1);
    key = key.substring(0, idx).trim().replace(/\s+/g, " ");
    if (value.length) env[key] = value;
    else delete env[key];
  }

  reply.reply(msg).text(printKey(key));

  function printKey(k) {
    if (Object.hasOwnProperty.call(env, k))
      return k + "=" + JSON.stringify(env[k]);
    return k + " unset";
  }
});

// Settings: Size
bot.command("resize", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  var match = /(\d+)\s*((\sby\s)|x|\s|,|;)\s*(\d+)/i.exec(arg.trim());
  if (match) var columns = parseInt(match[1]), rows = parseInt(match[4]);
  if (!columns || !rows)
    return reply.text("Use /resize <columns> <rows> to resize the terminal.");

  msg.context.size = { columns: columns, rows: rows };
  if (msg.context.command) msg.context.command.resize(msg.context.size);
  reply.reply(msg).html("Terminal resized.");
});

// Settings: Silent
bot.command("setsilent", function (msg, reply, next) {
  var arg = utils.resolveBoolean(msg.args());
  if (arg === null)
    return reply.html("Use /setsilent [yes|no] to control whether new output from the command will be sent silently.");

  msg.context.silent = arg;
  if (msg.context.command) msg.context.command.setSilent(arg);
  reply.html("Output will " + (arg ? "" : "not ") + "be sent silently.");
});

// Settings: Link previews
bot.command("setlinkpreviews", function (msg, reply, next) {
  var arg = utils.resolveBoolean(msg.args());
  if (arg === null)
    return reply.html("Use /setlinkpreviews [yes|no] to control whether links in the output get expanded.");

  msg.context.linkPreviews = arg;
  if (msg.context.command) msg.context.command.setLinkPreviews(arg);
  reply.html("Links in the output will " + (arg ? "" : "not ") + "be expanded.");
});

// Settings: Other chat access
bot.command("grant", "revoke", function (msg, reply, next) {
  if (msg.context.id !== owner) return;
  var arg = msg.args(1)[0], id = parseInt(arg);
  if (arg.trim().length === 0 || isNaN(id))
    return reply.html("Use %s or %s to control whether the chat with that ID can use this bot.", "/grant <id>", "/revoke <id>");
  reply.reply(msg);
  if (msg.command === "grant") {
    granted[id] = true;
    reply.html("Chat %s can now use this bot. Use /revoke to undo.", id);
  } else {
    if (contexts[id] && contexts[id].command)
      return reply.html("Couldn't revoke specified chat because a command is running.");
    delete granted[id];
    delete contexts[id];
    reply.html("Chat %s has been revoked successfully.", id);
  }
});
bot.command("token", function (msg, reply, next) {
  if (msg.context.id !== owner) return;
  var token = utils.generateToken();
  tokens[token] = true;
  reply.disablePreview().html("One-time access token generated. The following link can be used to get access to the bot:\n%s\nOr by forwarding me this:", bot.link(token));
  reply.command(true, "start", token);
});

// Welcome message, help
bot.command("start", function (msg, reply, next) {
  if (msg.args() && msg.context.id === owner && Object.hasOwnProperty.call(tokens, msg.args())) {
    reply.html("You were already authenticated; the token has been revoked.");
  } else {
    reply.html("Welcome! Use /run to execute commands, and reply to my messages to send input. /help for more info.");
  }
});

bot.command("help", function (msg, reply, next) {
  reply.html(
    "Use /run &lt;command&gt; and I'll execute it for you. While it's running, you can:\n" +
    "\n" +
    "‣ Reply to one of my messages to send input to the command, or use /enter.\n" +
    "‣ Use /end to send an EOF (Ctrl+D) to the command.\n" +
    "‣ Use /cancel to send SIGINT (Ctrl+C) to the process group, or the signal you choose.\n" +
    "‣ Use /kill to send SIGTERM to the root process, or the signal you choose.\n" + 
    "‣ For graphical applications, use /redraw to force a repaint of the screen.\n" +
    "‣ Use /type to press keys, or /keypad to show a keyboard for special keys.\n" + 
    "\n" +
    "You can see the current status and settings for this chat with /settings. Use /env to " +
    "manipulate the environment, /cd to change the current directory, /shell to see or " +
    "change the shell used to run commands and /resize to change the size of the terminal.\n" +
    "\n" +
    "By default, output messages are sent silently (without sound) and links are not expanded. " +
    "This can be changed through /setsilent and /setlinkpreviews. Note: links are " +
    "never expanded in status lines."
  );
});

// FIXME: add inline bot capabilities!
// FIXME: possible feature: restrict chats to UIDs
// FIXME: persistence
// FIXME: shape messages so we don't hit limits, and react correctly when we do


bot.command(function (msg, reply, next) {
  reply.reply(msg).text("Invalid command.");
});
