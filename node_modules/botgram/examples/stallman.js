#!/usr/bin/env node
// Remove privacy mode on this bot, then add it to groups to correct
// fellows who say Linux without the accompanying "GNU/".
// Usage: ./stallman.js <auth token>

var botgram = require("..");
var bot = botgram(process.argv[2]);

var rant = "When you say Linux, you probably mean the GNU operating " +
"system, running Linux as the kernel. You should therefore say " +
"GNU/Linux or GNU+Linux.";

bot.text(function (msg, reply, next) {
  var text = msg.text.toLowerCase();
  if (text.indexOf("linux") != -1 && text.indexOf("gnu") == -1)
    reply.reply(msg).text(rant);
});
