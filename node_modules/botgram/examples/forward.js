#!/usr/bin/env node
// This bot forwards every message it receives to a certain user.
// Usage: ./forward.js <auth token> <user ID>

var botgram = require("..");
var bot = botgram(process.argv[2]);
var target = parseInt(process.argv[3]);
if (isNaN(target)) process.exit(1);

bot.message(function (msg, reply, next) {
  reply.to(target).forward(msg);
});
