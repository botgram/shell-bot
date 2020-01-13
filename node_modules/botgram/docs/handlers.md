# Message handling

When a message is received, it's parsed into a [message object](message.md)
and processed by calling a series of user-registered callbacks, called *handlers*.

The first handler that matches the received message will be called. The handler
can use its third argument (see below) to request that the next matching handler
is called, and so on. If no (more) registered handlers match the message,
it'll be discarded.

The handler gets called with three arguments:

 - `msg`: The [message object](message.md) to process.
   Contains info about the received message.
 - `reply`: The [reply queue](reply.md) of the chat the message was sent to.
   Allows sending messages to that chat.
 - `next`: Callback that the handler must call if it couldn't process the
   message, so that processing will be tried with the next suitable handler.

**Important:** Read the corresponding [Bot API section](https://core.telegram.org/bots/faq#what-messages-will-my-bot-get)
to understand what messages are received, depending on whether privacy mode is enabled or not.


## Registering handlers

Handlers can be registered by calling the appropiate methods in the
bot object. Keep in mind handlers will be called in the order they were
registered.

The different kinds of handler to register are documented
below. The most general one is `all(handler)`, which gets any message
the bot could possibly receive.

A handler is always called with `this` being the bot object.

### `all(handler)`

Register a handler that will receive any incoming message.

Calling `all(handler)` is equivalent to `message(true, handler)`,
except that unknown messages will also be received if `ignoreUnknown`
is set to `false`.

### `message([alsoUpdates], handler)`

Register a handler that will receive all messages, of any
kind, except [chat updates](message.md#updates).

~~~ js
bot.message(function (msg, reply, text) {
  reply.text("I just received a: " + msg.type);
});
~~~

If you wish to receive chat updates as well, pass `true` as `alsoUpdates`:

~~~ js
bot.message(true, function (msg, reply, text) {
  // matches messages of any kind, including updates
});
~~~

### `text([alsoCommands], handler)`

Register a handler that will be called for text messages
**except commands**.

~~~ js
bot.text(function (msg, reply, text) {
  reply.text("You said: " + msg.text);
});
~~~

If you want the handler to receive commands as well, pass `true`
as `alsoCommands`, i.e:

~~~ js
bot.text(true, function (msg, reply, next) {
  // receives all text messages, including commands
});
~~~

### `mention([alsoCommands], [username...], handler)`

Equivalent to `text(alsoCommands, handler)` except that it
also filters texts that contain mentions to (at least) one
of the passed usernames. If no usernames are passed, it will
capture mentions to the bot. Examples:

~~~ js
bot.mention(function (msg, reply, next) {
  // msg is a mention to my username, and is not a command
});

bot.mention("foobar", function (msg, reply, next) {
  // msg is a mention to @foobar, and is not a command
});

bot.mention(true, "foobar", function (msg, reply, next) {
  // msg is a mention to @foobar, and can be a command
});
~~~

In the above example, a text message like `@foobar @<bot username>`
could be accepted by all three handlers. Usernames are checked
case insensitively.

**Note:** Telegram now supports mentions to users without
username. If you wish to capture these mentions, you should
use `text(...)` and filter based on `msg.entities`.

### `command([name...], handler)`

Register a handler that will only receive text messages
that are commands for this bot, matching one of the passed
names case-insensitively:

~~~ js
bot.command("hello", "start", function (msg, reply, next) {
  // will match any of:
  //
  //     /hello world
  //     /HeLLo dear
  //     /START the fricking show
  //     /start@<my username>
  //
  // but not:
  //
  //     /hello@<other username>
  //     /started
});
~~~

Regexes can also be passed for matching
(don't forget the `i` flag):

~~~ js
bot.command("process", /^process_\w+/i, function (msg, reply, next) {
  // will match /process, /process_foo, /process_bar, etc.
});
~~~

If you do not pass anything, the handler will be called for all
commands **directed exclusively to the bot**! This is the correct
way to implement default handlers like:

~~~ js
// handle all known commands here

// then the default handler
bot.command(function (msg, reply, next) {
  reply.text("Invalid command, oops!");
});
~~~

This way, the bot will silently ignore unknown commands in a group
(since they are probably for another bot), but will still answer
if its username is explicitely mentioned, i.e:

    [in group / supergroup chat]
    /unknown@<my username>
    Invalid command, oops!

In private chats, the default handler will also fire even if the
username is not explicitely mentioned, i.e.:

    [in private chat]
    /unknown
    Invalid command, oops!

If you want to catch all commands to this bot, even if not
exclusively for it, pass `true`:

~~~ js
bot.command(true, function (msg, reply, next) {
  // will match any previously unhandled command, even if on a group. use with care!
});
~~~

### `audio(handler)`

Register a handler that will receive all `audio` messages.

### `document([name...], handler)`

Register a handler that will receive all `document` messages (i.e. files).
If one or more filenames are passed as arguments, only documents matching
one of them will be handled.

A filename can be a glob pattern (`String`) or a regular expression object.
Glob patterns will be matched case-sensitively; use regular expressions
if you need case-insensitive matching.

~~~ js
bot.document(function (msg, reply, next) {
  // will match on any sent file
});

bot.document(/\.jpe?g$/i, function (msg, reply, next) {
  // will match on any files with jpg or jpeg extension
});

bot.document("DSC*.jpg", function (msg, reply, next) {
  // ...
});
~~~

### `photo(handler)`

Register a handler that will receive all `photo` messages.

### `video(handler)`

Register a handler that will receive all `video` messages.

### `video(handler)`

Register a handler that will receive all `videoNote` messages.

### `voice(handler)`

Register a handler that will receive all `voice` messages.

### `contact(handler)`

Register a handler that will receive all `contact` messages.

### `location(handler)`

Register a handler that will receive all `location` messages.

### `venue(handler)`

Register a handler that will receive all `venue` messages.

### `game(handler)`

Register a handler that will receive all `game` messages.

### `update([subject, [action]], handler)`

Register a handler that will receive chat updates.
If the `subject` argument is passed, only updates with that subject
will be received. If the `action` argument is passed, updates will
be further limited to that particular action.

~~~ js
bot.update("title", "new", function (msg, reply, next) { 
  console.log("Chat title changed to: %s", msg.title);
});

bot.update("member", function (msg, reply, next) {
  if (msg.action === "new")
    reply.text("New member! Welcome " + msg.member.name + " to the crew.");
  else
    reply.text("We'll miss you, " + msg.member.name);
});
~~~


## Miscellaneous

Because of the fallthrough message of handlers, it's common to register
special «middleware» handlers at the start:

~~~ js
var bot = botgram("...");
bot.all(middleware);

bot.command("start", (msg, reply, next) => {
  // ...
});

bot.text((msg, reply, next) => {
  // ...
});
~~~

These can implement logging functionality:

~~~ js
function middleware(msg, reply, next) {
  console.info("[%s] Received %s from chat %s (%s)",
      new Date().toISOString(), msg.type, msg.chat.id, msg.chat.name);
  next();
}
~~~

Filter messages:

~~~ js
var allowed = [2098161, 18094132, -512309154];
function middleware(msg, reply, next) {
  if (allowed.indexOf(msg.chat.id) === -1 && allowed.indexOf(msg.from.id) === -1) {
    reply.text("Permission denied. Please talk to the administrator.");
  } else {
    next();
  }
}
~~~

Or augment `msg` or `reply` with additional properties, for subsequent handlers to use:

~~~ js
var admins = [2098161, 18094132, -512309154];
function middleware(msg, reply, next) {
  if (admins.indexOf(msg.from.id) !== -1)
    msg.fromAdmin = true;
  next();
}
~~~

Botgram does provide a `context()` middleware, which sets `msg.context`
to an object that is shared with all the received messages from the same
chat. You can use this object to save chat-specific state such as preferences,
the last received command, privileges and stuff. Example:

~~~ js
var bot = botgram("...");

// Registers an all() handler that sets msg.context
bot.context({ presses: 0 });

bot.command("press", (msg, reply, next) => {
  msg.context.presses++;
  reply.text("Button has been pressed.");
});

bot.command("count", (msg, reply, next) => {
  reply.text("The button has been pressed " + msg.context.presses + " times in this chat.");
});
~~~

For practical examples see [`hasher`](../examples/hasher.js) or [the
shell runner](https://github.com/botgram/shell-bot). Keep in mind the context object
**is not persisted**, so while it's a great way to pull off prototypes,
you shouldn't use it (directly) in production.


## The edit queue

Some kinds of message can be edited after being posted. These edits are not
processed by the handlers you register normally (by calling `bot.xxx(...)`.
Instead, you should register them at the `bot.edited` queue. For example,
to listen for text messages being updated:

~~~ js
bot.edited.text(function (msg, reply, next) {
  console.log("Message from %s was edited on %s", msg.date, msg.editDate);
  console.log("New text is:", msg.text);
});
~~~

This «edit queue» has exactly the same features (handlers, sub-queues) as
the main one, and is completely independent from it. However not all messages
can be edited, so registering certain handlers in the edit queue (a `location`
or `update` one, for instance) is useless.

See the [`edit_echo`](../examples/edit_echo.js) example for a functional use
of the edit queue.

