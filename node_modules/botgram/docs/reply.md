# Reply queues

Reply queues allow you to send messages, while taking care of proper synchronization.
For instance, when you do:

~~~ js
reply.text("Here's a sticker:");
reply.sticker("BQADAgAD3gAD9HsZAAFphGBFqImfGAI");
~~~

If Botgram immediately sent both messages, there'd be a significant chance
the second completes before the first, so the sticker appears first
in the chat. Instead, the sticker is internally delayed (queued) until
previous messages are sent.

Each chat has its own, independent queue. Thus, only messages _within each chat_
are guaranteed to arrive in order. Additional synchronization should be implemented
manually (see `then(...)`).

**Note:** The `ReplyQueue` objects themselves are mere pointers to `bot` and
the chat ID of the queue. The actual synchronization and queues are all stored at
the `bot` object.

All methods of the `reply` object are chainable unless otherwise specified.


## Message sending

The methods below are used to send messages.

Keep in mind that Telegram imposes [limits](https://core.telegram.org/bots/faq#broadcasting-to-users)
on the bot's send rate. Botgram doesn't include any protection, so if you
hit limits errors will just be propagated (see «Getting result and handling errors» below).
This also seems to apply to edits.

### `text(text, [mode])`

  - `text` (`String`): Text of the message.
  - `mode` (`String` | `null`): Formatting of `text`.

Send a text message.

Accepted values for `mode` at the time of this writing are:

  - `null` or not passed: plain text.
  - `"HTML"`: some HTML tags can be used.
  - `"Markdown"`: basic Markdown syntax.

Please check the [Bot API section](https://core.telegram.org/bots/api#formatting-options)
for up to date details about available formatting modes and the limitations in place.

### `html(text, ...)`

  - `text` (`String`): HTML of the message.

Send an HTML message. Convenience method for `text(text, "HTML")`.

Additional arguments can be passed, and will be escaped and substituted
by successive `%s` in `text`:

~~~ js
reply.html("Current command: <strong>%s</strong>\nUptime: <strong>%s</strong>",
    "command > file", "3 days");
~~~

Please check the [Bot API section](https://core.telegram.org/bots/api#formatting-options)
for up to date details about available formatting modes and the limitations in place.

### `markdown(text)`

  - `text` (`String`): HTML of the message.

Send a Markdown message. Convenience method for `text(text, "Markdown")`.

Please check the [Bot API section](https://core.telegram.org/bots/api#formatting-options)
for up to date details about available formatting modes and the limitations in place.

### `photo(file, [caption], [captionMode])`

  - `file`: Image file to send.
  - `caption` (`String`): Optional caption.
  - `captionMode` (`String` | `null`): Formatting of `caption`, see [`text(...)`](#texttext-mode) for options.

Send a photo message.

### `audio(file, [duration], [performer], [title], [caption], [captionMode])`

  - `file`: Audio file to send, in `.mp3` format.
  - `duration` (integer): Duration of the clip in seconds.
  - `performer` (`String`): Song performer.
  - `title` (`String`): Song title.
  - `caption` (`String`): Optional caption.
  - `captionMode` (`String` | `null`): Formatting of `caption`, see [`text(...)`](#texttext-mode) for options.

Use this method to send audio files, if you want Telegram clients to display them in the music player.

At the time of this writing, bots can currently send audio files of up to 50 MB in size.
This limit may be changed in the future, check out the [Bot API section](https://core.telegram.org/bots/api#sendaudio) for up to date details.

### `document(file, [caption], [captionMode])`

  - `file`: File to upload.
  - `caption` (`String`): Optional caption.
  - `captionMode` (`String` | `null`): Formatting of `caption`, see [`text(...)`](#texttext-mode) for options.

Send a generic file.

At the time of this writing, bots can currently send files of up to 50 MB in size.
This limit may be changed in the future, check out the [Bot API section](https://core.telegram.org/bots/api#senddocument) for up to date details.

### `sticker(file)`

  - `file`: Image to send (`.webp` format).

Send an image as sticker.

### `video(file, [duration], [width], [height], [caption], [captionMode], [streaming])`

  - `file`: Video file to send. Telegram clients support MP4 videos.
  - `duration` (integer): Duration of the video in seconds.
  - `width` (integer): Width of the video in pixels.
  - `height` (integer): Height of the video in pixels.
  - `caption` (`String`): Optional caption.
  - `captionMode` (`String` | `null`): Formatting of `caption`, see [`text(...)`](#texttext-mode) for options.
  - `streaming` (`Boolean`): Indicates if the uploaded video is suitable for streaming.

Send a video.

At the time of this writing, bots can currently send videos of up to 50 MB in size.
This limit may be changed in the future, check out the [Bot API section](https://core.telegram.org/bots/api#sendvideo) for up to date details.

### `videoNote(file, [duration], [length])`

  - `file`: Video file to send. Telegram clients support MP4 videos.
  - `duration` (integer): Duration of the video in seconds.
  - `length` (integer): Width/height of the video.

Send a video note.

At the time of this writing, sending video notes by passing a URL is not supported. Send it by passing a stream or buffer, or an existing file.
This limit may be changed in the future, check out the [Bot API section](https://core.telegram.org/bots/api#sendvideonote) for up to date details.

### `voice(file, [duration], [caption], [captionMode])`

  - `file`: Audio file (`.ogg` encoded with OPUS).
  - `duration` (integer): Duration of the audio in seconds.
  - `caption` (`String`): Optional caption.
  - `captionMode` (`String` | `null`): Formatting of `caption`, see [`text(...)`](#texttext-mode) for options.

Send an audio file, which will be displayed by Telegram clients as a playable voice message.

At the time of this writing, bots can currently send voice messages of up to 50 MB in size.
This limit may be changed in the future, check out the [Bot API section](https://core.telegram.org/bots/api#sendvoice) for up to date details.

### `location(latitude, longitude)`

  - `latitude` (`Number`): Latitude in degrees.
  - `longitude` (`Number`): Longitude in degrees.

Send a location message (point on map).

### `venue(latitude, longitude, title, address, [foursquareId])`

  - `latitude` (`Number`): Latitude in degrees.
  - `longitude` (`Number`): Longitude in degrees.
  - `title` (`String`): Name of the venue.
  - `address` (`String`): Address of the venue.
  - `foursquareId` (`String`): Foursquare identifier of the venue.

Send information about a venue.

### `contact(phone, firstname, [lastname])`

  - `phone` (`String`): Contact's phone number.
  - `firstname` (`String`): Contact's first name.
  - `lastname` (`String`): Contact's last name.

Send information about a contact.

### `game(gameShortName)`

  - `gameShortName` (`String`): Short name of the game, serves as the unique identifier for the game.

Send a registered Telegram game. Part of the [Gaming platform](https://core.telegram.org/bots/api#games).

### `command([explicit], command, [args...])`

Convenience method that calls `bot.formatCommand(...)` to format
a command for this bot, and sends it as a text message. It won't
be received back, but a user can forward it to the current chat
to invoke it on the bot.

### `forward(id, chat)`

  - `id` (integer): ID of message to forward.
  - `chat` (`Chat` | integer): Chat where said message was sent.

Forward the message with specified ID. You _need_ to pass the ID of the
chat where you got this message from, and the bot needs to belong to it.

### `forward(msg)`

  - `msg` (`Message`): Message to forward.

Forward the passed message. Convenience method that extract fields and
calls `forward(id, chat)` as appropriate. Same restriction applies:
the bot needs to belong to the chat where `msg` was sent.

### `message(msg, [reforward])`

  - `msg` (`Message`): Message to send.
  - `reforward` (`Boolean`): Reforward forwarded messages.

Sends an equivalent message to the passed one, by calling the appropriate
method. For instance, if `msg.type == "location"` then `location(msg.latitude, msg.longitude)`
will be called. **The `msg.reply` field will be ignored;** apply it as a
modifier if needed.

**Important:** At the time of this writing, all kind of received messages
except games (and updates, which don't come from users) can be sent by bots,
but this
won't necessarily hold for the future (i.e. a new message type is added
but no method to send it yet), so it's recommended to call this method inside
a try - catch block to fallback in case it fails (i.e. by just forwarding).

If `reforward` is passed and `true`, then if `msg` is a forwarded message,
it'll be forwarded instead of resent, to preserve the same "forwarded" status.


## Modifiers

The methods below don't do anything, they just set additional parameters
for the next call to the other methods. For example:

~~~ js
reply.silent().reply(msg).text("yes!");
reply.text("hi");
~~~

The first text message will be sent silently and as a reply to `msg`.
It's important to keep in mind that **all modifiers are cleared** after
the action is queued, so the second text is not affected and will not
be sent silently nor as a reply.

Most modifiers are booleans, and can be enabled by simply calling the method
without arguments (i.e. `reply.selective()` is equivalent to `reply.selective(true)`).
All modifiers can be disabled explicitely by passing `null` (or also `false`,
for boolean ones).

### `silent([silent])`

  - `silent` (`Boolean`): Send message silently.

If enabled, the message will be sent [silently](https://telegram.org/blog/channels-2-0#silent-messages).
iOS users will not receive a notification, Android users will receive a notification with no sound.

### `disablePreview([disable])`

  - `disable` (`Boolean`): Disable link previews for links in this message.

If enabled, Telegram clients will not show any link previews for this message.

### `selective([selective])`

  - `selective` (`Boolean`): Make certain modifiers selective.

Setting this modifier has no effect on its own, but will limit
the effect of certain modifiers to specific users only.

### `forceReply([force])`

  - `force` (`Boolean`): Force a reply to the sent message.

Upon receiving the sent message, Telegram clients will display a reply interface
to the user (act as if the user has selected the bot‘s message and tapped «Reply»).
This can be extremely useful if you want to create user-friendly step-by-step
interfaces without having to sacrifice privacy mode.

If `selective()` is enabled, replies will be forced only to specific users:

 - Users that are mentioned in the message text.
 - If `reply()` is used, sender of the message we're replying to.

### `keyboard(keys, [resize], [oneTime])`

  - `keys` (Array of Array of keys | `false`): Keyboard to display.
  - `resize` (`Boolean`): Resize keyboard vertically for optimal fit.

Upon receiving the sent message, Telegram clients will display the
passed [custom keyboard](https://core.telegram.org/bots#keyboards) instead of the
default one. The user can switch between both keyboards by tapping a button.

The keyboard is described by `keys`, which is an array of rows, which are arrays
of keys. Each key is either a `String`, or an object with the following options:

  - `text` (`String`): Text of the button. If `request` is unset, it will be sent to the bot as a message when the button is pressed.
  - `request` (`String`): Optional, available in private chats only. If `"contact"`, the user's phone number will be sent as a contact when the button is pressed. If `"location"` the user's current location will be sent. Other values will be ignored.

The `resize` parameter requests clients to resize the keyboard vertically for
optimal fit (e.g., make the keyboard smaller if there are just two rows of buttons).
Defaults to `false`, in which case the custom keyboard is always of the same height
as the app's standard keyboard.

The `oneTime` parameter requests clients to switch to the other keyboard as soon as
the custom keyboard is used. It'll still be available by tapping a special button in
the input field.

To remove the keyboard permanently, call this method with no arguments or with `keys = false`.
Users won't be able to switch to the custom keyboard anymore.

Example:

~~~ js
var keyboard1 = [
  [ { text: "Use my location", request: "location" }, "Specify city", "Use other hint" ],
  [ "Discard", "Main menu" ],
];

// Display the keyboard
reply.keyboard(keyboard1, true).text("Where is the hint placed?");

// Remove keyboard
reply.keyboard().text("Hint saved.");
~~~

If `selective()` is enabled, the keyboard will be added or removed only to specific users:

 - Users that are mentioned in the message text.
 - If `reply()` is used, sender of the message we're replying to.

### `reply(msg)`

  - `msg` (`Message` | integer): Message to reply to.

Mark message as reply to the passed message.
Will be disabled if `msg` not passed or falsy.

### `inlineKeyboard(keys)`

  - `keys` (Array of Array of [`InlineKeyboardButton`](https://core.telegram.org/bots/api#inlinekeyboardbutton)): Inline keyboard to display.

Clients will display the passed [inline keyboard](https://core.telegram.org/bots#inline-keyboards-and-on-the-fly-updating)
below the sent message. Will be disabled if `keys` not passed or falsy.


## Other actions

The methods below perform other actions relevant to per-chat interaction,
but not specifically about posting a new message. These actions are
also queued, just like messages to be sent, and also clear all modifiers.
However some of them do not make use of any modifier.

### `action([action])`

  - `action` (`String`): Chat action to send.

Use this method when you need to tell the user that something is happening
on the bot's side. The status is set for 5 seconds or less (when a message
arrives from your bot, Telegram clients clear its typing status).
Chat actions only stick around for 5 seconds, so you should resend them
if you want them for longer.

`action` can be one of `"typing"` (default), `"upload_photo"`,
`"record_video"`, `"upload_video"`, `"record_audio"`, `"upload_audio"`,
`"record_video_note"`, `"upload_video_note"`,
`"upload_document"`, `"find_location"`.

This action doesn't use any modifiers.

Check out the [Bot API section](https://core.telegram.org/bots/api#sendchataction)
for up to date details, and the [`actions` example](../examples/actions.js)
for a live test.

### `editText(msg, text, [mode])`

  - `msg` (`Message` | integer | `String`): Message to edit.
  - `text` (`String`): New message text.
  - `mode` (`String`): New formatting mode.

Edit the text of a given text message. See `text(text, [mode])` for
info about the `mode` argument.

This action obeys the `disablePreview` and `inlineKeyboard` modifiers.

### `editHTML(msg, text)`

  - `msg` (`Message` | integer | `String`): Message to edit.
  - `text` (`String`): New message HTML.

Updates a text message to have the passed HTML. Convenience method for `editText(msg, text, "HTML")`.

Additional arguments can be passed, and will be escaped and substituted
by successive `%s` in `text`, in the same way as `.html(...)`.

### `editMarkdown(msg, text)`

  - `msg` (`Message` | integer | `String`): Message to edit.
  - `text` (`String`): New message Markdown text.

Updates a text message to have the passed Markdown. Convenience method for `editText(msg, text, "Markdown")`.

### `editReplyMarkup(msg)`

  - `msg` (`Message` | integer | `String`): Message to edit.

Edit the reply markup (actually, just the inline keyboard) of the passed message.
This action obeys the `inlineKeyboard` modifier.

### `editCaption(msg, caption)`

  - `msg` (`Message` | integer | `String`): Message to edit.
  - `caption` (`String`): The new caption text.

Edit the caption of the passed message.
This action obeys the `inlineKeyboard` modifier.

### `deleteMessage(msg)`

  - `msg` (`Message` | integer): Message to delete.

Delete a message sent at this chat (including updates).  
The following restrictions apply:

 - A message can only be deleted if it was sent less than 48 hours ago.
 - Bots can delete their own messages in groups and supergroups.
 - Bots granted `can_post_messages` permissions can delete their own
   messages in channels.
 - If the bot is an administrator of a group, it can delete any message there.
 - If the bot has `can_delete_messages` permission in a supergroup
   or a channel, it can delete any message there.

This action doesn't use any modifiers.

Check out the [Bot API section](https://core.telegram.org/bots/api#deleteMessage)
for up to date details.


## Miscellaneous

### Getting result and handling errors

All actions result in a request being made to the Bot API,
which can either fail, or return a result. By default,
failures are handled by emitting `error` events on the bot object,
and results are simply discarded.

To change this you can use the `then(callback)` method
on reply queues. The passed callback will be called when the last enqueued
action finishes, with arguments `(error, result)` as usual.

`then` must not be called more than once for each action, so **only use `then`
immediately after calling an action** to avoid incorrect use.

Example:

~~~ js
reply.text("Hi!").then((err, result) => {
  if (err)
    console.error("Sending message failed!");
  else
    console.log("Sent message:", result);
});
~~~

If a callback is set for an action, a `error` won't be emitted if the request fails.
The callback is called just before sending the next pending request (if any).

For all action methods that [send messages](#message-sending) or edit them,
`result` is a `Message` object describing the sent message, if successful.
The `action()` method always returns `true` if successful.

**Note:** The `edit*` actions can also be used to edit [inline messages](inline.md),
(when the bot is used as inline bot) in which case `true` is returned instead.

**Tip:** Calling `then()` without supplying a callback will set a special callback
and return a promise for the result.

### Getting a queue manually

When calling your message handlers, Botgram will retrieve the queue
for the chat the message was sent on, and pass it as the `reply` argument.

This is fine most of the time, but sometimes you may want to send messages on
another chat spontaneously (for instance, when building a ‘chat roulette’
bot, or notifying someone when the bot is started). The `bot#reply(...)`
method can be used to get a queue for some chat explicitely, by its numerical
ID or `Chat` object:

~~~ js
// Talk to user 2350913
var reply = bot.reply(2350913);
reply.text("Hi!");
~~~

However, special care must be taken because *talking to a user for the first
time, a user that has blocked the bot, or a group the bot is no longer part of*
will result in errors that should be caught and handled correctly. This can
happen anytime, but is more probable when using `bot.reply`.

Reply queues also have a convenience `to` method:
`reply.to(2350913)` is equivalent to calling `bot.reply` as above.


## Uploading files

Telegram offers multiple ways of uploading files when sending messages.

### Sending by file ID

If the file is already in Telegram servers (uploaded by you or anyone else),
you'll have a `File` object representing it (i.e. `msg.file`) or a `String`
with its ID (i.e. `msg.file.id`). In that case, just pass it as the `file`
argument when sending:

~~~ js
var lastVideo = null;
bot.video((msg, reply) => {
  lastVideo = msg.file;
});

bot.command("sendlastvideo", (msg, reply) => {
  reply.text("Last video I received was:");
  reply.video(lastVideo);
});
~~~

~~~ js
var someSticker = "BQADAgAD3gAD9HsZAAFphGBFqImfGAI";

// Passing file ID directly is fine, too
reply.sticker(someSticker);
~~~

**Important:** There are additional limits if you send files this way,
check out the corresponding [Bot API section](https://core.telegram.org/bots/api#sending-files).

### Sending in-place

To upload the file along with the message, simply pass a `ReadableStream`
or a `Buffer` as the `file` argument. Example:

~~~ js
var fs = require("fs");

reply.audio(fs.createReadStream("assets/music.ogg"), null, "Foo", "Bar", "Some cute track");
reply.then((err, sentMessage) => {
  if (err) throw err;
  // It's now in their servers, we can grab sentMessage.file and use that from now on
});

var buffer = fs.readFileSync("assets/photo.jpg");
buffer.options = "photo.jpg"; // ALWAYS set the filename (not needed for file streams)
reply.photo(buffer, "Random photo");
~~~

Limits: 10 MB max size for photos, 50 MB for other files.

### Sending as URL

Simply pass an HTTP URL as the `file` argument. Telegram will download and store the file.
Example:

~~~ js
reply.voice("http://backend.example.com/files/voice294.ogg?token=4c89c8167");
reply.then((err, sentMessage) => {
  if (err) throw err;
  // It's now in their servers, we can grab sentMessage.file and use that from now on
});
~~~

Limits: 5 MB max size for photos, 20 MB for other types of content.

**Important:** There are additional limits if you send files this way,
check out the corresponding [Bot API section](https://core.telegram.org/bots/api#sending-files).

