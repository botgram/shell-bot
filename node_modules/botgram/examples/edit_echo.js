#!/usr/bin/env node
// This bot echoes back whatever you send to it, similar to
// the echo example, but also replays edits you make to your
// messages.
// Usage: ./edit_echo.js <auth token>

var botgram = require("..");
var bot = botgram(process.argv[2]);

// Maps received messages to sent messages. `sent_messages[id]`
// is a promise for our (last edit of) user's message with `id`.
var sentMessages = {};

bot.message(function (msg, reply, next) {
  sentMessages[msg.id] = reply.message(msg).then();
});

// Receive edits to messages
bot.edited.all(function (msg, reply, next) {
  // If we didn't echo this message, we can't edit it either
  if (!sentMessages[msg.id]) return;

  // If this is a text message, edit it
  if (msg.text) {
    sentMessages[msg.id] = sentMessages[msg.id].then(function (ownMsg) {
      return reply.editText(ownMsg, msg.text).then();
    });
  }

  // If the message has a caption, edit it
  if (msg.caption) {
    sentMessages[msg.id] = sentMessages[msg.id].then(function (ownMsg) {
      return reply.editCaption(ownMsg, msg.caption).then();
    });
  }
});
