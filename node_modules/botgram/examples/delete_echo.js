#!/usr/bin/env node
// This bot works like the echo example, only each echoed message has an
// inline button that tells the bot to delete it when pressed.
// Usage: ./delete_echo.js <auth token>

var botgram = require("..");
var bot = botgram(process.argv[2]);

bot.message(function (msg, reply, next) {
  try {
    reply.inlineKeyboard([
      [ { text: "🔪 Delete", callback_data: "delete_echo.deleteMe" } ]
    ]).message(msg);
  } catch (err) {
    reply.text("Couldn't resend that.");
  }
});

bot.callback(function (query, next) {
  // Verify this query is, indeed, for us
  if (query.data !== "delete_echo.deleteMe") return next();

  // Try to delete the message where the button was pressed
  try {
    // first, get the reply queue
    var reply = bot.reply(query.message.chat);
    // delete the message
    reply.deleteMessage(query.message).then(whenDeleted);
  } catch (err) { whenDeleted(err); }

  // Always answer the query when done
  function whenDeleted(err) {
    if (err)
      query.answer({ text: "Couldn't delete message", alert: true });
    else
      query.answer({ text: "Deleted!" });
  }
});
