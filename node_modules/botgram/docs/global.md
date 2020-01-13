# Bot instance

A bot object is created by calling `botgram` with the bot's
authentication token as the first argument:

~~~ js
var botgram = require("botgram");
var bot = botgram("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11");
~~~

An options object may be passed as the second argument;
the following options are supported:

 - `timeout`: Use a different timeout, in seconds, for long polling (default: 10 minutes).
 - `agent`: Agent to use when making requests to Telegram (default: `undefined`, use Node.JS default).
 - `strict`: Enable strict mode (throw errors whenever we see unknown fields in the
   responses, do extra steps to verify responses are as we expect; default: no)
 - `autodetect`: Make a `getMe` call to the API, to test the auth token and get the bot's
   username, id and names. If autodetection is disabled, the user should manually set them (default: yes).
 - `retryInterval`: When a network error occurs, Botgram will wait this time, in milliseconds, before trying to get updates again (default: 2000).
 - `ignoreUnknown`: If we receive a message of unknown type, ignore it silently (default: yes).
   If false, the message will be processed by `all()` handlers.


## Connection pooling; running behind proxies

As said above, the `agent` object passed at the options object is in charge of managing
TCP connections made to Telegram severs. By default, Node.JS default agent is used,
which can create many connections when there are many parallel requests, but will not
keep them open.

In order to improve responsiveness and performance of your bot, you could create an
agent with options `keepAlive: true`. By default only 256 connections will be kept
open; you can adjust this limit if you want. Example:

~~~ js
var https = require("https");

var myAgent = new https.Agent({ keepAlive: true, maxFreeSockets: 5 });
var bot = botgram(apiToken, { agent: myAgent });
~~~

If you're behind a corporate proxy, you could use [`https-proxy-agent`](https://github.com/TooTallNate/node-https-proxy-agent)
to have Botgram make all requests through that proxy:

~~~ js
var HttpsProxyAgent = require("https-proxy-agent");

var myAgent = new HttpsProxyAgent({ host: '168.63.76.32', port: 3128, keepAlive: true, maxFreeSockets: 5 });
var bot = botgram(apiToken, { agent: myAgent });
~~~


## Lifecycle

When a bot is created, no requests to Telegram's API are made [until
the next tick](https://nodejs.org/api/process.html#process_process_nexttick_callback_args).
This means **you should register all handlers and set any parameters
immediately** after creating the bot, otherwise you risk losing messages.

When the next tick arrives `autodetect()` is called, which
performs a `getMe` request to the API to discover the bot's username
and other details. When those are set, the processing loop starts.

#### Skipping autodetection

If you already know that data and want to skip autodetection, pass
`autodetect = false` in the options object and set it manually after
creating the bot:

    var bot = botgram("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", {autodetect: false});
    bot.set("username", "my_cool_bot");
    bot.set("firstname", "Mr");
    bot.set("lastname", "Bot");

The processing loop will start immediately on the next tick.

#### Processing loop

A `ready` event will be emitted just before the processing loop starts.
When this event fires (and from then on) the bot's details are populated
and can be retrieved with `get()` if wanted.

    bot.on("ready", function () {
      console.log("Bot (%s) starting to process messages.", bot.get("firstname"));
      // bot.link() needs username to be set, so it also can't be called earlier
      console.log("Talk to me: %s", bot.link());
    });

When the update processing loop starts, it'll first download (and deliver
to your handlers) any accumulated updates that appeared while the bot wasn't
running. Please note [Telegram only stores updates for a limited amount of
time](), so if the bot is offline for a long time some updates will be permanently
lost.

Once those "queued" updates have been consumed, a `synced` event will be emitted.
Then the processing loop will keep running, consuming real-time updates as they
arrive and delivering them to handlers.

#### Error handling

A call to `getUpdates` failing *because of a network error* isn't fatal: an `updateError`
will be emitted and it'll be and retried after `options.retryInterval` milliseconds
unless the bot is explicitely stopped. Any other kind of error in the processing
loop will cause an `error` event to be emitted.

The processing loop isn't the only thing that can cause `error` objects to be emitted;
messages failing to be sent (network error or not) will also cause them unless `.then()`
is used, see [the corresponding section](reply.md#getting-result-and-handling-errors).

So it's a good idea to listen to `error` events anyway.

#### Username changes

The bot's details aren't expected to change while it's running.
This applies specifically to the username. If the username changes,
you *must* make Botgram aware of the change manually, otherwise it'll
keep using the old username for links, command parsing, etc.

To update the username and bot details while the processing loop is running,
you can either call `bot.autodetect()` or set them manually using
`bot.set("username", x)` and so on.

#### Stopping the bot

The bot can be stopped at any point by calling `bot.stop()`. This stops the
processing loop if it's running, or prevents it from starting if it's not
running yet.

After `bot.stop()` is called the bot will not emit any further `ready` or
`synced` events. However if the processing loop was running, the current
batch of updates will still be delivered to the handlers. A last
`getUpdates` request will be made to mark those as consumed, so Telegram
doesn't deliver them to the bot when ran again. This last request will *not*
be retried if it fails, though, so there's still a chance of that happening.

**Note:** If you've passed a [custom agent](#connection_pooling_running_behind_proxies),
it's recommended to call `agent.destroy()` when no longer using it.


## Updates

Updates that the bot receives fall into several categories:

 - **Messages** are the most common type of update. This kind of update is
   always generated in a particular *chat* which the bot is a participant of.
   Message *edits* also fall in this category.
   
   These updates are processed by calling a series of user-registered callbacks,
   called *handlers*, in order. [Read more][handlers].

 - **Callback queries** are a very specific type of update that is generated
   when the user taps buttons in [inline keyboards][inlineKeyboard].
   
   These updates are processed by calling an independent series of user-registered
   callbacks to handle it. The bot is expected to *answer* all incoming callback
   queries. [Read more][callback].

 - **Inline queries** and **chosen inline results** are generated when this
   bot is used as an [inline bot][inline mode]. [Read more][inline].

Updates that can't be identified as falling in either of these categories (i.e.
because they were added recently to the API and botgram can't handle them yet)
will be permanently discarded. If the `strict` option is set to `true`, an error
will be emitted.

TODO: talk about resolving, hardcoding IDs and resolving at the start


## File downloading

### `fileGet(file, callback)`

### `fileLink(file)`

### `fileStream(file, callback)`

### `fileLoad(file, callback)`


## Chat info

### `getChat(chat, callback)`

Retrieve information for a chat (or user). Returns an extended `Chat` object
if successful.

You can also use this method to resolve a username by passing a string
(`"username"`, `"@username"`) as the `chat`.

### `getProfilePictures`

### `setChatTitle`

### `setChatDescription`

### `setChatPhoto`

### `deleteChatPhoto`

### `pinChatMessage`

### `unpinChatMessage`


## Chat membership

### `exportChatInviteLink`

### `kickMember(chat, user, [until], callback)`

`until` can be passed as either of:

 - An absolute `Date` when the ban ends.
 - Duration of the ban, in seconds (number).

If `until` is not passed, the user will be banned forever.
The user will *also* be banned if `until` is less than 30 seconds
away, or more than 366 days away. So if want a short ban, make
sure to pass `40` or similar to prevent an accidental permanent ban.

See the [API section](https://core.telegram.org/bots/api#kickchatmember)
for up to date info.

### `unbanMember`

### `leaveChat`

### `getChatAdministrators`

### `getChatMembersCount`

### `getChatMember`

### `promoteChatMember(chat, user, privileges, callback)`

### `restrictChatMember(chat, user, privileges, [until], callback)`

The meaning and value of the optional `until` parameter is the
same as in `kickMember`.

See the [API section](https://core.telegram.org/bots/api#restrictchatmember)
for up to date info.


## Message related

### `link(`

### `linkGroup(`

### `linkGame(`

### `setGameScore`

### `getGameHighScores`

### `formatCommand`


## Sticker sets

### `getStickerSet`

### `uploadStickerFile`

### `createNewStickerSet`

### `addStickerToSet`

### `setStickerPositionInSet`

### `deleteStickerFromSet`


## Core

### `get`

### `set`

### `autodetect`

### `ready(callback)`

### `synced(callback)`

### `stop(`

### `callMethod(`

FIXME: - set error callback instead of panicking
FIXME: test docs links!


## Things not exposed

While we try and cover the whole API, there are a couple of
things that have been intentionally left not exposed.

### Webhooks

Botgram cannot make use of webhooks, it always uses long polling.
Webhooks are extremely unconvenient to setup and get working,
they are error prone, unauthenticated (no secret to verify it's
Telegram calling it), insecure (unless you setup and maintain HTTPS),
and do not seem to provide efficiency as soon as the bot gets
some decent traffic.

Long polling, on the other hand, is really easy to implement and
requires zero configuration from either side.

**Important:** Telegram doesn't allow the long polling method (the
one used by Botgram to get updates) while a webhook is set on your
bot, so **if you have used webhooks previously, disable them
explicitely before using Botgram**.

### Update IDs

Update IDs are there only to verify that updates are received in
the correct order, and ensure there are no lost updates. Because
botgram handles update receiving for the user, exposing them
is useless.



[handlers]: handlers.md
[callback]: callback.md
[inline]: inline.md
[inline mode]: https://core.telegram.org/bots/api#inline-mode
[inlineKeyboard]: reply.md#inlinekeyboardkeys
