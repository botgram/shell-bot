#!/usr/bin/env node
// This bot just sends you chat actions when you click inline buttons.
// Usage: ./actions.js <auth token>

var botgram = require("..");
var bot = botgram(process.argv[2]);

// A (hopefully) unique string so we can know if the callback queries are for us
var TYPE = "zp.0a";

bot.command("help", function (msg, reply, next) {
  reply.markdown("Hey! I'm a simple bot that will send you chat actions. Use /start to get a list of actions to send.");
});

bot.command("start", function (msg, reply, next) {
  function encodeData(action) {
    return JSON.stringify({ type: TYPE, action: action, chatId: msg.chat.id });
  }

  reply.inlineKeyboard([
    [
      { text: "✏️ Type", callback_data: encodeData("typing") },
      { text: "📍 Find location", callback_data: encodeData("find_location") }
    ],

    [
      { text: "📷 Upload photo", callback_data: encodeData("upload_photo") }
    ],

    [
      { text: "🎥 Record video", callback_data: encodeData("record_video") },
      { text: "📎 Upload video", callback_data: encodeData("upload_video") }
    ],

    [
      { text: "🎙 Record audio", callback_data: encodeData("record_audio") },
      { text: "📎 Upload audio", callback_data: encodeData("upload_audio") }
    ],

    [
      { text: "🔴 Record video note", callback_data: encodeData("record_video_note") },
      { text: "📎 Upload video note", callback_data: encodeData("upload_video_note") }
    ],

    [
      { text: "📄 Upload document", callback_data: encodeData("upload_document") }
    ]
  ]);

  reply.markdown("Press any button below and I'll send you a chat action!");
});

bot.callback(function (query, next) {
  // Try to parse the query, otherwise pass it down
  try {
    var data = JSON.parse(query.data);
  } catch (e) {
    return next();
  }

  // Verify this query is, indeed, for us
  if (data.type !== TYPE) return next();

  // Try to send the chat action where the payload says
  // DON'T DO THIS AT HOME! A bad client could manipulate the
  // value of any field and make the bot send actions to whoever he wants!
  bot.reply(data.chatId).action(data.action).then(function (err) {
    if (err)
      return query.answer({ text: "Couldn't send the chat action, can the bot talk here?" });
    query.answer();
  });

  // Encoding request data in callback_data is practical but
  // shouln't be done in production because callback_data can
  // only be up to 64 bytes long, and a client could send
  // specially crafted data, such as:
  //
  //     { "type": TYPE }
  //
  // which would make this code crash at the call to bot.reply(...)
});
