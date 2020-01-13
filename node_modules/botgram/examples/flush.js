#!/usr/bin/env node
// Bot that just discards all queued updates and exits.
// Useful when developing, or just to test the auth token.
// Usage: ./flush.sh <auth token>

var botgram = require("..");
var bot = botgram(process.argv[2], {timeout: 1});

bot.on("ready", function () {
  console.log("Authenticated, discarding updates...");
});

bot.on("synced", function () {
  bot.stop();
});
