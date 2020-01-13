#!/usr/bin/env node
// This bot echoes back whatever you send to it.
// Usage: ./echo.js <auth token>

var botgram = require("..");
var bot = botgram(process.argv[2]);

bot.message(function (msg, reply, next) {
  reply.text("You said:");
  try {
    reply.message(msg);
  } catch (err) {
    reply.text("Couldn't resend that.");
  }
});
