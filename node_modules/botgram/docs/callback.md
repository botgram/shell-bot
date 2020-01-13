# Callback queries

These are generated when the user taps a button on the
[inline keyboard](reply.md#inlinekeyboardkeys) of a message sent by, or via, the bot.

Incoming queries are processed in a similar way to messages. The user
registers a series of callbacks (handlers) after creating the bot. When
the bot receives a query, each handler is called in order.

When a handler is called to process a query, it should first check
if it's able to handle the query. If it is, then it should *answer*
the query using its `answer` method. Otherwise, it should pass control
to the next handler using the `next` argument.

That way callback queries can be intercepted from multiple points in
your code (possibly, one for each type of inline keyboard created), and
they'll coexist nicely as long as an incoming query can be discriminated
to only one handler. There isn't any official way nor convention to do
this, so you'll have to make up one.

## Query object

Incoming callback queries are parsed into a `Query` object that can have
the following properties:

  - `id` (`String`): Unique identifier for this query.
  - `from` (`User`): User that pressed the button, in the same format as `msg.from`.
  - `message` ([`Message`]): Original message where the callback button was present.
    Will *not* be available if the message is too old.
  - `inlineMessageId` (`String`): If the button was on a message sent via this bot, ID of the sent message.
  - `chatInstance` (`String`): Global identifier, uniquely corresponding to the chat to which the
    message with the callback button was sent. Useful for high scores in games.
  - `data` (`String`): Payload data associated with the callback button. Be aware that a bad
    client can send arbitrary data in this field.
  - `gameShortName` (`String`): Short identifier of the game to send.
    Part of the [Gaming platform](https://core.telegram.org/bots/api#games).


## `bot.callback(handler)`

Register a callback query handler. The handler is called with `query` (the
incoming [`Query`](#query-object) to process) as its first argument, and a
special function `next` as the second argument, which can be called to pass
control to the next handler.


## `query.answer([options], [callback])`

Answer the callback query. `options` can have the following properties:

  - `text` (`String`): Short text message to show in the notification (default: no notification).
  - `alert` (`Boolean`): Show an alert instead of a notification at the top of the chat screen (default: `false`).
  - `url` (`String`): URL that will be opened by the user's client. Part of the [Gaming platform](https://core.telegram.org/bots/api#games).
  - `cacheTime` (`Integer`): The maximum amount of time in seconds that the result of the callback query may be cached client-side (default: `0`, no caching).

`callback` will be called when the request has finished, with the error passed as first argument if applicable.
Otherwise, an `error` event will be emitted on the bot if the request fails.

Callback queries should be answered only once.


## Example

This is an example that uses an imaginary API to let certain users
manipulate the system's volume using callback buttons.

~~~ js
// People who are allowed to manipulate the volume
var ALLOWED_SENDERS = [ 8951984, 5091503, ... ];

bot.command("volumeknob", function (msg, reply, next) {
  reply.inlineKeyboard([[
    { text: "↑  Turn up", callback_data: JSON.stringify({ type: "volume", direction: true }) },
    { text: "↓  Turn down", callback_data: JSON.stringify({ type: "volume", direction: false }) },
  ]]);
  reply.text("Use the buttons below to modify the volume:");
});

bot.callback(function (query, next) {
  // Try to parse payload data as JSON. If we succeed, and `type` is set
  // to "volume" then the query is for us.
  var data;
  try {
    data = JSON.parse(query.data);
  } catch (e) {
    return next();
  }
  if (data.type !== "volume")
    return next();

  // Check sender is in whitelist
  if (ALLOWED_SENDERS.indexOf(query.from.id) === -1)
    return query.answer({ text: "Permission denied." });
  
  // Turn volume up or down
  if (data.direction) {
    system.volumeUp();
    query.answer();
  } else {
    system.volumeDown();
    query.answer();
  }
});
~~~

For a simple example (that also shows how to delete messages),
look at the [`delete_echo`](../examples/delete_echo.js) example
or the [`actions`](../examples/actions.js) example.

For a more complex (and functional) example, look
at the [shell bot example](https://github.com/botgram/shell-bot).
