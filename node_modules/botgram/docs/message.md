# Message object

The first argument passed to handlers, which will be called
`msg` throughout this document, contains a description about
the message that is being processed.

> Suggestion: Running the [`print`](../example/print.js) example and
> forwarding or sending messages to your bot is a great way to
> see what info does Telegram give and how it's structured in
> the message object.

All messages have the following data:

 - `msg.id` returns the message ID.

 - `msg.date` returns a `Date` object with the time this message
   was posted.

 - `msg.editDate`  returns a `Date` object with the time the message has
   been last edited. Not present if the message has not been edited.

 - `msg.chat` returns information about the chat this message was sent to:
     - `msg.chat.id` returns the chat's unique ID. It's a positive integer for users, and a negative one for groups.
     - `msg.chat.type` returns one of `user`, `group`, `supergroup` and `channel`.
     - `msg.chat.title` returns the group, supergroup or channel title. Not present if this is a user.
     - `msg.chat.firstname` returns the user's first name. Only present if this is a user.
     - `msg.chat.lastname` returns the user's last name, or `null` if not set. Only present if this is a user.
     - `msg.chat.username` returns the chat's username, or `null` if not set. Only present if this is a user or channel.
     - `msg.chat.allMembersAreAdmins` returns `true` if ‘All Members Are Admins’ is enabled, `false` otherwise. Only present if this is a group.
     - `msg.chat.name` returns the first name and last name joined for users, or title for everything else.

 - `msg.from` (not present on channels) returns information about the user who sent this message:
     - `msg.from.id` returns the user's unique ID.
     - `msg.from.type` returns `user`.
     - `msg.from.firstname` returns the user's first name.
     - `msg.from.lastname` returns the user's last name, or `null` if not set.
     - `msg.from.username` returns the chat's username, or `null` if not set.
     - `msg.from.name` returns the first name and last name joined.
     - `msg.from.language` returns the [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) of the user's language

 - `msg.forward` (only present on forwarded messages) returns information about
   the original message:
     - `msg.forward.date` returns a `Date` object when the original message was posted.
     - `msg.forward.id` returns the ID of the original message. Only present if
       forwarded from a channel.
     - `msg.forward.chat` returns information about the chat the message was forwarded from,
       in the same format as `msg.chat`. Only present if forwarded from a channel.
     - `msg.forward.from` returns information about the user who sent the message,
       in the same format as `msg.from`. Not present if forwarded from a channel.

 - `msg.reply` (only present if this message is a reply to another message) returns
   information about the message being replied to, in the same format as `msg`.
   Note even if `msg.reply` itself is a reply, `msg.reply.reply` will not be present.

 - `msg.group` is an alias to `msg.chat` if the message was sent to a group
   or supergroup, not present otherwise.

 - `msg.user` is an alias to `msg.chat` if the message was sent on a user (private)
   chat, not present otherwise.

 - `msg.queued` returns `true` if the message was sent while the bot was
   not running.

 - `msg.edited` returns `true` if this message is an edit (and was sent on [the
   edit queue](handlers.md#the-edit-queue)), not present otherwise.


## Text

Text messages have the following additional fields:

 - `msg.type` returns `text`.

 - `msg.text` returns the raw message text.

 - `msg.entities` returns an array of entities present in `msg.text`:

     - `msg.entities[x].type` returns the type of entity: `mention`,
       `hashtag`, `bot_command`, `url`, `email`, `bold`, `italic`, `code`, `pre`,
       `text_link` (for clickable text URLs) or `text_mention` (for mentions to
       users without username).

     - `msg.entities[x].offset` returns the offset, in characters, at which the
       entity starts in `msg.text`.

     - `msg.entities[x].length` returns the length, in characters, that the
       entity spans in `msg.text`.

     - `msg.entities[x].url` returns the URL to be opened, if `type` is `text_link`.
       Not present otherwise.

     - `msg.entities[x].user` returns the user that was mentioned, if `type` is
       `text_mentioned`. Not present otherwise.

 - `msg.mentions()` returns an array of usernames, one for every `@mention` in
   `msg.text`, and in order of appearance (there might be duplicates present).
   Items are stripped from the leading `@`.

 - `msg.mentions(x)` returns the number of mentions for username `x` in the message.
   The username is checked case-insensitively, use `msg.mentions()` manually if
   a case-sensitive search is wanted.

 - `msg.hashtags()` returns an array of hashtags, one for every `#hashtag` in
   `msg.text`, and in order of appearance (there might be duplicates present).
   Items are stripped from the leading `#`.

 - `msg.hashtags(x)` returns the number of appearances of hashtag `x` in the message.
   The hashtag is checked case-insensitively, use `msg.hashtags()` manually if
   a case-sensitive search is wanted.

Texts of the form `/<name>[@<username>] <args>` are also *commands* and have
the following extra fields:

 - `msg.command` returns the command name, i.e. the word after the slash.

 - `msg.args()` returns the whole arguments string.

 - `msg.args(N)` returns a list of N arguments, by splitting the string
   by the first N-1 spaces. If fewer spaces are found, the returned list
   will have less than N items. In any case, if no arguments are present
   `[]` will be returned.

 - `msg.username` returns the username, if present in the command, otherwise `null`.

 - `msg.mine` returns `true` if the command is aimed at this bot (at least).

 - `msg.exclusive` returns `true` if the command is aimed **exclusively** to this
   bot (either because it's a private chat, or because the username was present
   and matched this bot's).


## Audio

These messages contain audio to be treated as music by the Telegram clients.
Audio messages have the following additional fields:

 - `msg.type` returns `audio`.

 - `msg.duration` returns the duration of the audio in seconds, as defined by the sender.

 - `msg.file` returns information about the audio file:
     - `msg.file.id` returns the ID of the file.
     - `msg.file.size` returns the size of the file if known, not present otherwise.
     - `msg.file.mime` returns the MIME type of the file if defined, not present otherwise.

 - `msg.performer` returns the performer of the audio as defined by sender or by audio tags, not present otherwise.

 - `msg.title` returns the title of the audio as defined by sender or by audio tags, not present otherwise.


## Document

Document messages contain a general file, or attachment, and have the following
additional fields:

 - `msg.type` returns `document`.

 - `msg.file` returns information about the attached file:
     - `msg.file.id` returns the ID of the file.
     - `msg.file.size` returns the size of the file if known, not present otherwise.
     - `msg.file.mime` returns the MIME type of the file if defined, not present otherwise.

 - `msg.filename` returns the original filename if defined, not present otherwise.

 - `msg.thumbnail` returns information about the document's thumbnail as defined by sender, not present otherwise.
     - `msg.thumbnail.file` returns information about the image file:
         - `msg.thumbnail.file.id` returns the ID of the file.
         - `msg.thumbnail.file.size` returns the size of the file if known, not present otherwise.
     - `msg.thumbnail.width` returns the width of the image in pixels.
     - `msg.thumbnail.height` returns the height of the image in pixels.


## Photo

Photo messages have the following additional fields:

 - `msg.type` returns `photo`.

 - `msg.sizes` returns an array of images, containing all available sizes of the photo.
   Each size (item) has the following fields:
     - `msg.sizes[x].file` returns information about the image file:
         - `msg.sizes[x].file.id` returns the ID of the file.
         - `msg.sizes[x].file.size` returns the size of the file if known, not present otherwise.
     - `msg.sizes[x].width` returns the width of the image in pixels.
     - `msg.sizes[x].height` returns the height of the image in pixels.

 - `msg.image` points to the larger size available in `msg.sizes`.

 - `msg.caption` returns a caption for the photo of 200 characters at most, if defined. Not present otherwise.


## Sticker

Sticker messages have the following additional fields:

 - `msg.type` returns `sticker`.

 - `msg.file` returns information about the sticker image:
     - `msg.file.id` returns the ID of the file.
     - `msg.file.size` returns the size of the file if known, not present otherwise.

 - `msg.width` returns the width of the sticker in pixels.

 - `msg.height` returns the height of the sticker in pixels.

 - `msg.emoji` returns a string with the emoji associated to the sticker if known, not present otherwise.

 - `msg.setName` returns a string with the name of the sticker set this sticker belongs to (if available, not present otherwise).

 - `msg.thumbnail` returns information about the sticker's thumbnail if available, not present otherwise.
     - `msg.thumbnail.file` returns information about the image file:
         - `msg.thumbnail.file.id` returns the ID of the file.
         - `msg.thumbnail.file.size` returns the size of the file if known, not present otherwise.
     - `msg.thumbnail.width` returns the width of the image in pixels.
     - `msg.thumbnail.height` returns the height of the image in pixels.

 - `msg.maskPosition` returns the position where the mask should be placed, for mask stickers. Not present otherwise.
     - `msg.maskPosition.point` returns a string with the part of the face relative to which the mask
       should be placed (at the time of this writing, one of `forehead`, `eyes`, `mouth`, or `chin`).
     - `msg.maskPosition.shift` returns an object with a pair of numbers, specifying the mask shift (measured in mask widths / heights scaled
       to the face size):
         - `msg.maskPosition.shift.x` returns the X-axis shift, from left to right.
           For example, choosing `-1.0` will place the mask just to the left of the default mask position.
         - `msg.maskPosition.shift.y` returns the Y-axis shift, from top to bottom.
           For example, choosing `1.0` will place the mask just below the default mask position.
     - `msg.maskPosition.scale` returns a number with the relative mask scaling coefficient (i.e. `1.0` means original scale).



## Video

Video messages have the following additional fields:

 - `msg.type` returns `video`.

 - `msg.width` returns the width of the video in pixels, as defined by sender.

 - `msg.height` returns the height of the video in pixels, as defined by sender.

 - `msg.duration` returns the duration of the video in seconds, as defined by sender.

 - `msg.file` returns information about the video file:
     - `msg.file.id` returns the ID of the file.
     - `msg.file.size` returns the size of the file if known, not present otherwise.
     - `msg.file.mime` returns the MIME type of the file if defined, not present otherwise.

 - `msg.thumbnail` returns information about the video thumbnail if available, not present otherwise.
     - `msg.thumbnail.file` returns information about the image file:
         - `msg.thumbnail.file.id` returns the ID of the file.
         - `msg.thumbnail.file.size` returns the size of the file if known, not present otherwise.
     - `msg.thumbnail.width` returns the width of the image in pixels.
     - `msg.thumbnail.height` returns the height of the image in pixels.

 - `msg.caption` returns a caption for the video of 200 characters at most, if defined. Not present otherwise.


## Video note

As of Telegram v.4.0, users can send short rounded [video messages](https://telegram.org/blog/video-messages-and-telescope),
using an interface similar to that of voice notes.

Video note messages have the following additional fields:

 - `msg.type` returns `videoNote`.

 - `msg.length` returns the width/height of the video in pixels, as defined by sender.

 - `msg.duration` returns the duration of the video in seconds, as defined by sender.

 - `msg.file` returns information about the video file:
     - `msg.file.id` returns the ID of the file.
     - `msg.file.size` returns the size of the file if known, not present otherwise.

 - `msg.thumbnail` returns information about the video thumbnail if available, not present otherwise.
     - `msg.thumbnail.file` returns information about the image file:
         - `msg.thumbnail.file.id` returns the ID of the file.
         - `msg.thumbnail.file.size` returns the size of the file if known, not present otherwise.
     - `msg.thumbnail.width` returns the width of the image in pixels.
     - `msg.thumbnail.height` returns the height of the image in pixels.


## Voice

Voice messages have the following additional fields:

 - `msg.type` returns `voice`.

 - `msg.duration` returns the duration of the audio as defined by sender.

 - `msg.file` returns information about the audio file:
     - `msg.file.id` returns the ID of the file.
     - `msg.file.size` returns the size of the file if known, not present otherwise.
     - `msg.file.mime` returns the MIME type of the file if defined, not present otherwise.


## Contact

Contact messages have the following additional fields:

 - `msg.type` returns `contact`.

 - `msg.phone` returns the contact's phone number.

 - `msg.firstname` returns the contact's first name.

 - `msg.lastname` returns the contact's last name if defined, not present otherwise.

 - `msg.userId` returns the contact's Telegram user ID if known, not present otherwise.


## Location

Location messages have the following additional fields:

 - `msg.type` returns `location`.

 - `msg.longitude` returns a decimal longitude as defined by sender.

 - `msg.latitude` returns a decimal latitude as defined by sender.


## Venue

Venue messages have the following additional fields:

 - `msg.type` returns `venue`.

 - `msg.location` returns the venue location coordinates.

     - `msg.location.longitude` returns a decimal longitude.
     - `msg.location.latitude` returns a decimal latitude.

 - `msg.title` returns the name of the venue.

 - `msg.address` returns the address of the venue.

 - `msg.foursquareId` returns the Foursquare identifier of the venue
   if known, not present otherwise.


## Game

Game messages have the following additional fields:

 - `msg.type` returns `game`.

 - `msg.title` returns the game title.

 - `msg.description` returns the game description.

 - `msg.photo` returns the game photo.

 - `msg.text` returns optional text.

 - `msg.entities` returns entities in `msg.text`, only present if `msg.text` is present.
   In the same format as for text messages.

 - `msg.animation` returns an animation of the game for clients to show if specified, not present otherwise.

     - `msg.animation.file` returns the animation file.
         - `msg.animation.file.id` returns the ID of the file.
         - `msg.animation.file.size` returns the size of the file if known, not present otherwise.
         - `msg.animation.file.mime` returns the MIME type of the file if defined, not present otherwise.
     - `msg.animation.filename` returns the filename of the animation file if known, not present otherwise.
     - `msg.animation.thumb` returns information about the animation thumbnail if available, not present otherwise.
         - `msg.animation.thumbnail.file` returns information about the image file:
             - `msg.animation.thumbnail.file.id` returns the ID of the file.
             - `msg.animation.thumbnail.file.size` returns the size of the file if known, not present otherwise.
         - `msg.animation.thumbnail.width` returns the width of the image in pixels.
         - `msg.animation.thumbnail.height` returns the height of the image in pixels.


## Update

This type of message (usually called «service message» in the official
API docs) indicates some kind of change or event in a chat,
such as someone entering a group, new photo, and so on. Updates
are the only kind of message that can't be resent. Update
messages have the following additional fields:

 - `msg.type` returns `update`.

### Member updates

 - `msg.subject` returns `member`, indicating that some users' membership
   to a chat changed.
 - `msg.action` returns `new` if the user is now a member of the chat,
   or `leave` if the user is no longer a member of the chat.
 - `msg.member` (when `action` is `leave`) returns the user whose chat
   membership changed, in the same format as `msg.from`.
 - `msg.members` (when `action` is `new`) returns an array of users whose
   chat membership changed, each of which in the same format as `msg.from`.

### Title updates

 - `msg.subject` returns `title`, indicating that the title changed.
 - `msg.action` returns `new` if a new title has been set.
 - `msg.title` returns the chat's current title after the change.

### Photo updates

 - `msg.subject` returns `photo`, indicating that the chat photo changed.
 - `msg.action` returns `new` if a (new) photo was set, or `delete` if the
   existing photo was removed.
 - `msg.photo` returns the chat's current photo after the change. Not
   present if the photo was removed.

### Chat updates

 - `msg.subject` returns `chat`, indicating that the change affects the
   chat as a whole.
 - `msg.action` returns `create` if the chat has been created, `migrateTo`
   if this chat has been migrated to a new one and no longer exists, and
   `migrateFrom` if this chat has been created as a result of a migration.
 - `msg.toId` returns the numeric ID of the chat that has been created to
   migrate this one. Only present if `msg.action` is `migrateTo`.
 - `msg.fromId` returns the numeric ID of the chat that was migrated to this
   one, and no longer exists. Only present if `msg.action` is `migrateFrom`.

At the time of this writing, migrations only occur from groups to supergroups.
When migrated, a `migrateTo` update is first sent at the group, and then a
`migrateFrom` update is sent at the supergroup. Since they are redundant,
you'll probably only want to listen on one of them.

### Message updates

 - `msg.subject` returns `message`, indicating that the change affects a
   particuar message of the chat.
 - `msg.action` returns `pin` if a (new) message was pinned to this chat.
 - `msg.message` returns the affected message, in the same format as `msg`.


## Unknown

If botgram could't recognize this type of message (either because
it's empty, or because a new type of message was added to the API
and botgram does not support it yet), then `msg.type` will not
be present.

Instead, `msg.unparsed` will be set to the raw `Message` object
with any unparsed fields left. This is for debugging purposes only;
you should not depend on this feature, as newer versions of botgram
will parse the message and break your code.

Note that by default, unknown messages are discarded unless the
`ignoreUnknown` option is set.
