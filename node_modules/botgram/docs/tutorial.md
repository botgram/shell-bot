# Tutorial

This document will walk you through creating your first
Telegram bot with Botgram. Before we begin, you should
install Telegram if you don't have it already,
[talk to the BotFather](https://telegram.me/BotFather)
and register your first bot.

It takes less than a minute, and you will be given an **auth
token**, which looks like this:

    123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

You'll need this auth token to be able to run the snippets
and examples.


## Hello world!

To use Botgram, you first create a Bot object:

~~~ js
var bot = botgram("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11");
~~~

Then, to start receiving Telegram messages, register some handlers:

~~~ js
bot.command("start", function (msg, reply, next) {
  console.log("Received a /start command from", msg.from.username);
});

bot.text(function (msg, reply, next) {
  console.log("Received a text message:", msg.text);
});
~~~

Handlers are functions that react to some kind of message.
In the above example, we've registered three handlers: one for
`start` commands and another for texts.

When the bot receives a message, it calls the first handler that
matches it, passing it the message as the first parameter `msg`.
If no handlers match, the message will be silently ignored.

Try running that code (remember to put your actual auth token in it)
and talk to your bot!


## Sending replies

Printing to the console is okay, but not very interesting. Let's
actually reply to the user when they send us a text, using the
`reply` object:

~~~ js
bot.text(function (msg, reply, next) {
  reply.text("hello!");
});
~~~


## More message types

In Telegram, messages aren't limited to just texts: they can be stickers,
media, attached files, locations, contacts... Botgram allows you to recieve
them just fine:

~~~ js
bot.contact(function (msg, reply, next) {
  console.log("User %s sent us a contact:", msg.from.firstname);
  console.log(" * Phone: %s", msg.phone);
  console.log(" * Name: %s %s", msg.firstname, msg.lastname);
  reply.text("Ok, got that contact.");
});

bot.video(function (msg, reply, next) {
  reply.text("That's a " + msg.width + "x" + msg.height + " video.");
});

bot.location(function (msg, reply, next) {
  reply.text("You seem to be at " + msg.latitude + ", " + msg.longitude);
});
~~~

Curious about the attributes of `msg`? [Look here][message] for
a complete reference of them, for every type of message.

Curious about the different kinds of handlers you can register?
[Look here][handlers] for a complete reference of them.


## Downloading files

For photo messages, videos, files and other media, `msg` doesn't contain the
actual binary contents, only a `file` object with some kind of ID.
You have to call `bot.fileGet` like this:

~~~ js
bot.voice(function (msg, reply, next) {
  bot.fileGet(msg.file, function (err, info) {
    if (err) throw err;
    console.log("We got the link:", bot.fileLink(info));
  });
});
~~~

Now, whenever someone sends a voice note to the bot, it'll print something like:

    We got the link: https://api.telegram.org/file/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/document/file_0.opus

This link lets you download the actual audio file.
You can do it all in one step with `bot.fileLoad`:

~~~ js
bot.voice(function (msg, reply, next) {
  bot.fileLoad(msg.file, function (err, buffer) {
    if (err) throw err;
    console.log("Downloaded! Writing to disk...");
    require("fs").writeFile("voice.ogg", buffer);
  });
});
~~~

This example will write the binary contents (stored at `buffer`)
into a file `voice.ogg`.

This is just a silly example. While using `bot.fileLoad` is
convenient sometimes, it's fairly limited (you can't get updates
on the download progress, for instance) and it stores the *whole
file into memory*, which is bad practice.

So most times it's better to either download
the file yourself, or use [`fileStream`][fileStream].
See the [`hasher.js` example](../examples/hasher.js).


## Richer replies

Just like you can receive them, you can send them. Here's a
quick example:

~~~ js
bot.command("whereareyou", function (msg, reply, next) {
  reply.text("I'm at:");
  reply.location(38.8976763, -77.0387185);
});

bot.photo(function (msg, reply, next) {
  reply.markdown("Here's some _good_ sticker:");
  reply.sticker("BQADAgAD3gAD9HsZAAFphGBFqImfGAI");
});
~~~

Sending more interesting messages, such as photos or videos,
requires *uploading* a file to Telegram. This can be done by
simply passing a [readable stream](https://nodejs.org/api/stream.html#stream_stream),
for instance from a file:

~~~ js
bot.command("send_drawing", function (msg, reply, next) {
  var stream = fs.createReadStream("./drawing.jpg");
  reply.action("upload_photo");
  reply.photo(stream, "My drawing");
});
~~~

The photo (and any message coming after it) won't be actually sent until
the file has been fully uploaded. Because that can take a noticeable
amount of time, we first sent a *chat action* so people will see "Bot is
uploading a photo..." on the status bars until a message arrives.

Curious about `reply` methods? [Look here][reply] for a
complete reference of them, and their parameters.


## Reusing media

Unless you're generating and sending lots of different photos, chances
are you'll want to send a photo multiple times. Good news! Once a file has
been uploaded, Telegram lets you reuse it by simply grabbing its assigned ID
and passing it instead of a stream.

To do this, upload the photo (as always) and look at the sent message:

~~~ js
  var stream = fs.createReadStream("./drawing.jpg");
  reply.photo(stream, "My drawing").then(function (err, sentMessage) {
    // sentMessage is a Message object with a file property, just like other photo messages
    console.log("The ID is:", sentMessage.file.id);
  });
~~~

This will print out something like:

    The ID is: AgADBAADrKgxG3NfmFB617NPKX8uoffgaBkABJGRkXADQIYIAaIEAAEC

So from now on, whenever your bot wants to send that file, it can just do:

~~~ js
  reply.photo("AgADBAADrKgxG3NfmFB617NPKX8uoffgaBkABJGRkXADQIYIAaIEAAEC", "Some lil' drawing");
~~~

Hardcoding is okay―but nothing stops you from storing those IDs
in a database, for instance. And all this applies to every kind of files,
but **mixing contexts is not allowed**:

~~~ js
  // This will fail, since we uploaded the file as a photo
  reply.document("AgADBAADrKgxG3NfmFB617NPKX8uoffgaBkABJGRkXADQIYIAaIEAAEC");
~~~

Every way to send files has some limitations, which you should be aware of.
For more information on uploading and sending files, [look here][uploading].


## Fallthrough

Up until now we never used the third argument passed to the handlers,
which we usually call `next`. It's a function that handlers can call to
"pass" the message to the next matching handler.

This can be used for all sorts of good effects. Suppose we have a bot
with some useful commands:

~~~ js
bot.command("time", function (msg, reply, next) {
  reply.text("The current time is: " + Date());
});

bot.command("quit", function (msg, reply, next) {
  reply.text("Shutting down the bot.");
  process.exit(0);
});

bot.command("pwd", function (msg, reply, next) {
  reply.text("Bot is running from: " + require("path").resolve(__dirname));
});

bot.command("eval", function (msg, reply, next) {
  var code = msg.args();
  try {
    reply.text("Result: " + eval(code).toString());
  } catch (e) {
    reply.text(e.toString());
  }
});
~~~

This works, but we'd like to restrict the `quit` and `eval` commands
to certain users only. A good way to do it is to register a special handler
at the start:

~~~ js
bot.all(function (msg, reply, next) {
  if (msg.from.id === 5981248 || msg.from.id === 9824830)
    msg.hasPrivileges = true;
  next();
});
~~~

Now, all incoming messages will be checked to see if they come from a
special user. If they do, the `hasPrivileges` property will be set.
The message will continue processing as before, but subsequent handlers
can now look at `msg.hasPrivileges` and react accordingly:

~~~ js
bot.all(function (msg, reply, next) {
  if (msg.from.id === 5981248 || msg.from.id === 9824830)
    msg.hasPrivileges = true;
  next();
});

bot.command("time", function (msg, reply, next) {
  reply.text("The current time is: " + Date());
});

bot.command("quit", function (msg, reply, next) {
  if (!msg.hasPrivileges) {
    reply.text("Only some users can quit the bot.");
    return;
  }
  reply.text("Shutting down the bot.");
  process.exit(0);
});

bot.command("pwd", function (msg, reply, next) {
  reply.text("Bot is running from: " + require("path").resolve(__dirname));
});

bot.command("eval", function (msg, reply, next) {
  if (!msg.hasPrivileges) {
    reply.text("Did you SERIOUSLY thought I was going to evaluate code from strangers?");
    return;
  }
  var code = msg.args();
  try {
    reply.text("Result: " + eval(code).toString());
  } catch (e) {
    reply.text(e.toString());
  }
});
~~~

Suppose that we'd also like to filter out messages that were sent
while the bot was offline (i.e. messages where `msg.queued` is set).
Botgram doesn't have an option to do that, but it's easy to do with
a handler at the start:

~~~ js
bot.all(function (msg, reply, next) {
  if (!msg.queued) next();
});
~~~


## Context

Here's a particularily useful handler to put at the start of your bots:

~~~ js
var contexts = {};
bot.all(function (msg, reply, next) {
  if (!contexts[msg.chat.id])
    contexts[msg.chat.id] = {};
  msg.context = contexts[msg.chat.id];
  next();
});
~~~

It assigns a single object to every chat, and puts it under `msg.context`.
Further handlers can use this shared object to save preferences, temporary
state (like the command in progress) or more. Example:

~~~ js
bot.command("press", (msg, reply, next) => {
  msg.context.pressed = true;
});

bot.command("info", (msg, reply, next) => {
  if (msg.context.pressed)
    reply.text("The button has been pressed at least once in this chat.");
  else
    reply.text("Button has never been pressed...");
});
~~~

In fact, this kind of handler is so useful when prototyping that it's
built-in into the library, as the `context` method. So, you can replace the
`all` handler above with just:

~~~ js
bot.context();
~~~

But starting out with an empty object when we hear from a chat for the first
time is boring. You can pass an object to `context` and it'll be used as the
starting value. For instance, here's an improved version of the bot:

~~~ js
bot.context({ presses: 0 });

bot.command("press", (msg, reply, next) => {
  msg.context.presses++;
  reply.text("Button has been pressed.");
});

bot.command("count", (msg, reply, next) => {
  reply.text("The button has been pressed " + msg.context.presses + " times in this chat.");
});
~~~

Look at the [`hasher` example][hasher] for a good example, or
[here][fallthrough] for more information about fallthrough
and context in Botgram.


---

Return to the [**documentation**][index].



[index]: index.md
[message]: message.md
[handlers]: handlers.md
[reply]: reply.md
[fileStream]: global.md#filestreamfile-callback
[uploading]: reply.md#uploading-files
[fallthrough]: handlers.md#miscellaneous
[hasher]: ../examples/hasher.js
