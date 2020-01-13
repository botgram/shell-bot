#!/usr/bin/env node
// Bot that prints all received messages and edits to the console.
// Useful when developing, or just to test the auth token.
// Usage: ./print.sh <auth token>

var botgram = require("..");
var bot = botgram(process.argv[2], {ignoreUnknown: false});
var util = require("util");

bot.ready(function () {
  console.log("I'm user %s (%s).", bot.get("id"), bot.get("firstname"));
});

bot.synced(function () {
  console.log("\nTalk to me: %s", bot.link());
  console.log("Waiting for messages...");
});

function handler(msg, reply, next) {
  var type = msg.type ? msg.type : "unknown message";
  type = msg.edited ? ("Edited " + type) : capitalize(type);
  console.log("\n%s at %s %s (%s):", type, msg.chat.type, msg.chat.id, msg.chat.name);
  console.log(util.inspect(msg, {colors: true, depth: null}));
}

bot.all(handler);
bot.edited.all(handler);

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}
