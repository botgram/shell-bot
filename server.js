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
    return reply.html("没有命令在运行.");
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
    return reply.html("没有命令在运行.");

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
    return reply.html("没有命令在运行.");
  if (msg.command === "type" && !args) args = " ";
  msg.context.command.sendInput(args, msg.command === "type");
});
bot.command("control", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (!msg.context.command)
    return reply.html("没有命令在运行.");
  if (!arg || !/^[a-zA-Z]$/i.test(arg))
    return reply.html("Use /control &lt;letter&gt; to send Control+letter to the process.");
  var code = arg.toUpperCase().charCodeAt(0) - 0x40;
  msg.context.command.sendInput(String.fromCharCode(code), true);
});
bot.command("meta", function (msg, reply, next) {
  var arg = msg.args(1)[0];
  if (!msg.context.command)
    return reply.html("没有命令在运行.");
  if (!arg)
    return msg.context.command.toggleMeta();
  msg.context.command.toggleMeta(true);
  msg.context.command.sendInput(arg, true);
});
bot.command("end", function (msg, reply, next) {
  if (!msg.context.command)
    return reply.html("没有命令在运行.");
  msg.context.command.sendEof();
});

// Redraw
bot.command("redraw", function (msg, reply, next) {
  if (!msg.context.command)
    return reply.html("没有命令在运行.");
  msg.context.command.redraw();
});

// Command start
bot.command("run", function (msg, reply, next) {
  var args = msg.args();
  if (!args)
    return reply.html("使用 /run &lt;linux命令&gt; 运行VPS的linux命令.");

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
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
    return reply.html("没有命令在运行.");
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
      content += "\n没有其他聊天被授权，使用/ grant或/ token允许其他聊天使用该bot.";
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
    reply.html("你已经认证过了; 此token已被吊销.");
  } else {
    reply.html("欢迎使用fclone shell bot! Use /run to execute commands, and reply to my messages to send input. /help for more info.");
  }
});

bot.command("help", function (msg, reply, next) {
  reply.html(
    "<em>fclone转存常用命令</em>\n" +
    "\n" +
    "‣ /fq      极速转存模式.\n" +
    "‣ /fqa     极速序列模式.\n" +
    "‣ /fp      点点转存模式.\n" +
    "‣ /fb      全盘备份模式.\n" +
    "‣ /fs      定向size查询.\n" +
    "‣ /fsingle 复制单体功能.\n" +
    "‣ /fd      定向查重功能.\n" +
    "‣ /fc      定向比对功能.\n" +
    "‣ /fcl     清空回收站.\n" +
    "‣ /cancel  终止当前进程(Ctrl+C)；\n" + 
    "\n" +
    "<em>shellbot通用命令</em>\n" +
    "\n" +
    "‣ /status  查看此聊天的当前状态和设置;\n" + 
    "‣ /cd      改变当前目录;\n" +
    "‣ /run     linux命令&gt; 运行VPS的linux命令;\n" + 
    "‣ /kill    发送程序结束SIGTERM信号，当然也可以指定程序结束.; \n" +
    "‣ /end     相当于VPS的Linux的(Ctrl+D).\n" +
    "\n" +
    "<em>注意事项</em>\n" +
    "‣注：命令交互输入，如回复Y选择进一步操作，需要在TG以回复信息方式进行，或者/enter &lt;交互内容！\n"
  );
});

// 一键快速转存bot command = "/fq"
bot.command("fq", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 一键快速转存"/fq" command that should be used
  var args = "/root/fclone_shell_bot/script/fqcopy.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 一键快速序列转存bot command = "/fqa"
bot.command("fqa", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 一键快速序列转存"/fqa" command that should be used
  var args = "/root/fclone_shell_bot/script/fqcopy_a.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 点对点转存bot command = "fp"
bot.command("fp", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 点对点转存"/fp" command that should be used
  var args = "/root/fclone_shell_bot/script/fpcopy.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 全盘备份bot command = "/fb"
bot.command("fb", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 全盘备份"/fb" command that should be used
  var args = "/root/fclone_shell_bot/script/fbcopy.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 定向size查询bot command = "/fs"
bot.command("fs", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 定向size查询"/fs" command that should be used
  var args = "/root/fclone_shell_bot/script/fsize.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 自动整理bot command = "/fsingle"
bot.command("fsingle", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 自动整理"/fsingle" command that should be used
  var args = "/root/fclone_shell_bot/script/fsingle.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 定向查重bot command = "/fd"
bot.command("fd", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 定向查重"/fd" command that should be used
  var args = "/root/fclone_shell_bot/script/fdedup.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 定向比对bot command = "/fc"
bot.command("fc", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 定向比对"/fc" command that should be used
  var args = "/root/fclone_shell_bot/script/fcheck.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// 清空回收站bot command = "/fcl"
bot.command("fcl", function (msg, reply, next) {

  if (msg.context.command) {
    var command = msg.context.command;
    return reply.text("一条命令正在运行中.");
  }

  if (msg.editor) msg.editor.detach();
  msg.editor = null;

// 清空回收站"/fcl" command that should be used
  var args = "/root/fclone_shell_bot/script/fcleanup.sh";
  msg.context.command = new Command(reply, msg.context, args);
  msg.context.command.on("exit", function() {
    msg.context.command = null;
  });
});

// FIXME: add inline bot capabilities!
// FIXME: possible feature: restrict chats to UIDs
// FIXME: persistence
// FIXME: shape messages so we don't hit limits, and react correctly when we do

bot.command(function (msg, reply, next) {
  reply.reply(msg).text("Invalid command.");
});