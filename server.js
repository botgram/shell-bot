#!/usr/bin/env node
// Starts the bot, handles permissions and chat context,
// interprets commands and delegates the actual command
// running to a Command instance. When started, an owner
// ID should be given.

var path = require("path");
var fs = require("fs");
var botgram = require("botgram");
var escapeHtml = require("escape-html");
var utils = require("./lib/utils");
var Command = require("./lib/command").Command;
var Editor = require("./lib/editor").Editor;

var CONFIG_FILE = path.join(__dirname, "config.json");
try {
    var config = require(CONFIG_FILE);
} catch (e) {
    console.error("Couldn't load the configuration file, starting the wizard.\n");
    require("./lib/wizard").configWizard({ configFile: CONFIG_FILE });
    return;
}

var bot = botgram(config.authToken, { agent: utils.createAgent() });
var owner = config.owner;
var tokens = {};
var granted = {};
var contexts = {};
var defaultCwd = process.env.HOME || process.cwd();

var fileUploads = {};

bot.on("updateError", function (err) {
  console.error("Error when updating:", err);
});

bot.on("synced", function () {
  console.log("Bot ready.");
});


function rootHook(msg, reply, next) {
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
    interactive: false,
    linkPreviews: false,
  };

  msg.context = contexts[id];
  next();
}
bot.all(rootHook);
bot.edited.all(rootHook);


// Replies
bot.message(function (msg, reply, next) {
  if (msg.reply === undefined || msg.reply.from.id !== this.get("id")) return next();
  if (msg.file)
    return handleDownload(msg, reply);
  if (msg.context.editor)
    return msg.context.editor.handleReply(msg);
  if (!msg.context.command)
    return reply.html("No command is running.");
  msg.context.command.handleReply(msg);
});

// Edits
bot.edited.message(function (msg, reply, next) {
  if (msg.context.editor)
    return msg.context.editor.handleEdit(msg);
  next();
});

// Convenience command -- behaves as /run or /enter
// depending on whether a command is already running
bot.command("r", function (msg, reply, next) {
  // A little hackish, but it does show the power of
  // Botgram's fallthrough system!
  msg.command = msg.context.command ? "enter" : "run";
  next();
});

// Signal sending
bot.command("cancel", "kill", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (!msg.context.command)
    return reply.html("No command is running.");

  var group = msg.command === "cancel";
  var signal = group ? "SIGINT" : "SIGTERM";
  if (arg) signal = arg.trim().toUpperCase();
  if (signal.substring(0,3) !== "SIG") signal = "SIG" + signal;
  try {
    msg.context.command.sendSignal(signal, group);
  } catch (err) {
    reply.reply(msg).html("Couldn't send signal.");
  }
});

// Input sending
bot.command("enter", "type", function (msg, reply, next) {
  var args = msg.args();
  if (!msg.context.command)
    return reply.html("No command is running.");
  if (msg.command === "type" && !args) args = " ";
  msg.context.command.sendInput(args, msg.command === "type");
});
bot.command("control", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (!msg.context.command)
    return reply.html("No command is running.");
  if (!arg || !/^[a-zA-Z]$/i.test(arg))
    return reply.html("Use /control &lt;letter&gt; to send Control+letter to the process.");
  var code = arg.toUpperCase().charCodeAt(0) - 0x40;
  msg.context.command.sendInput(String.fromCharCode(code), true);
});
bot.command("meta", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (!msg.context.command)
    return reply.html("No command is running.");
  if (!arg)
    return msg.context.command.toggleMeta();
  msg.context.command.toggleMeta(true);
  msg.context.command.sendInput(arg, true);
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
  var args = msg.args();
  if (!args)
    return reply.html("Use /run &lt;command&gt; to execute something.");

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("A command is already running.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

  console.log("Chat «%s»: running command «%s»", msg.chat.name, args);
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// Editor start
bot.command("file", function (msg, reply, next) {
  var args = msg.args();
  if (!args)
    return reply.html("Use /file &lt;file&gt; to view or edit a text file.");

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.reply(command.initialMessage.id || msg).text("A command is running.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

  try {
    var file = path.resolve(msg.context.cwd, args);
    msg.context.editor = new Editor(reply, file);
  } catch (e) {
    reply.html("Couldn't open file: %s", e.message);
  }
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

// File upload / download
bot.command("upload", function (msg, reply, next) {
  var args = msg.args();
  if (!args)
    return reply.html("Use /upload &lt;file&gt; and I'll send it to you");

  var file = path.resolve(msg.context.cwd, args);
  try {
    var stream = fs.createReadStream(file);
  } catch (e) {
    return reply.html("Couldn't open file: %s", e.message);
  }

  // Catch errors but do nothing, they'll be propagated to the handler below
  stream.on("error", function (e) {});

  reply.action("upload_document").document(stream).then(function (e, msg) {
    if (e)
      return reply.html("Couldn't send file: %s", e.message);
    fileUploads[msg.id] = file;
  });
});
function handleDownload(msg, reply) {
  if (Object.hasOwnProperty.call(fileUploads, msg.reply.id))
    var file = fileUploads[msg.reply.id];
  else if (msg.context.lastDirMessageId == msg.reply.id)
    var file = path.join(msg.context.cwd, msg.filename || utils.constructFilename(msg));
  else
    return;

  try {
    var stream = fs.createWriteStream(file);
  } catch (e) {
    return reply.html("Couldn't write file: %s", e.message);
  }
  bot.fileStream(msg.file, function (err, ostream) {
    if (err) throw err;
    reply.action("typing");
    ostream.pipe(stream);
    ostream.on("end", function () {
      reply.html("File written: %s", file);
    });
  });
}

// Status
bot.command("status", function (msg, reply, next) {
  var content = "", context = msg.context;

  // Running command
  if (context.editor) content += "Editing file: " + escapeHtml(context.editor.file) + "\n\n";
  else if (!context.command) content += "No command running.\n\n";
  else content += "Command running, PID "+context.command.pty.pid+".\n\n";

  // Chat settings
  content += "Shell: " + escapeHtml(context.shell) + "\n";
  content += "Size: " + context.size.columns + "x" + context.size.rows + "\n";
  content += "Directory: " + escapeHtml(context.cwd) + "\n";
  content += "Silent: " + (context.silent ? "yes" : "no") + "\n";
  content += "Shell interactive: " + (context.interactive ? "yes" : "no") + "\n";
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
  if (arg) {
    if (msg.context.command) {
      var command = msg.context.command;
      return reply.reply(command.initialMessage.id || msg).html("Can't change the shell while a command is running.");
    }
    try {
      var shell = utils.resolveShell(arg);
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
  if (arg) {
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

  reply.html("Now at: %s", msg.context.cwd).then().then(function (m) {
    msg.context.lastDirMessageId = m.id;
  });
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
  var arg = msg.args(1)[0] || "";
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

// Settings: Interactive
bot.command("setinteractive", function (msg, reply, next) {
  var arg = utils.resolveBoolean(msg.args());
  if (arg === null)
    return reply.html("Use /setinteractive [yes|no] to control whether shell is interactive. Enabling it will cause your aliases in i.e. .bashrc to be honored, but can cause bugs in some shells such as fish.");

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.reply(command.initialMessage.id || msg).html("Can't change the interactive flag while a command is running.");
  }
  msg.context.interactive = arg;
  reply.html("Commands will " + (arg ? "" : "not ") + "be started with interactive shells.");
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
  if (!arg || isNaN(id))
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
    "‣ Use /type or /control to press keys, /meta to send the next key with Alt, or /keypad to show a keyboard for special keys.\n" + 
    "\n" +
    "You can see the current status and settings for this chat with /status. Use /env to " +
    "manipulate the environment, /cd to change the current directory, /shell to see or " +
    "change the shell used to run commands and /resize to change the size of the terminal.\n" +
    "\n" +
    "By default, output messages are sent silently (without sound) and links are not expanded. " +
    "This can be changed through /setsilent and /setlinkpreviews. Note: links are " +
    "never expanded in status lines.\n" +
    "\n" +
    "<em>Additional features</em>\n" +
    "\n" +
    "Use /upload &lt;file&gt; and I'll send that file to you. If you reply to that " +
    "message by uploading me a file, I'll overwrite it with yours.\n" +
    "\n" +
    "You can also use /file &lt;file&gt; to display the contents of file as a text " +
    "message. This also allows you to edit the file, but you have to know how..."
  );
});

// FIXME: add inline bot capabilities!
// FIXME: possible feature: restrict chats to UIDs
// FIXME: persistence
// FIXME: shape messages so we don't hit limits, and react correctly when we do


bot.command(function (msg, reply, next) {
  reply.reply(msg).text("Invalid command.");
});
