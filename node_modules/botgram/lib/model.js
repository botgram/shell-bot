// Models entities from the Telegram API, provides methods
// to parse responses into our models. Also provides methods
// to "resolve" IDs of entities.

var utils = require("./utils");
var checkObj = utils.checkObj;
var checkStr = utils.checkStr;
var checkBool = utils.checkBool;
var checkArr = utils.checkArr;
var checkInt = utils.checkInt;
var checkNum = utils.checkNum;

function Message() {}
function MessageEntity() {}
function Chat() {}
function File() {}
function Image() {}
function InlineQuery() {}
function ChosenInlineResult() {}
function Location() {}
function CallbackQuery() {}
function ChatMember() {}
function Animation() {}
function GameHighScore() {}
function MaskPosition() {}
function Sticker() {}
function StickerSet() {}

Message.prototype.parse = function parse(msg, options) {
  checkObj(msg);

  this.id = checkInt(msg.message_id);
  delete msg.message_id;

  this.date = new Date(checkInt(msg.date) * 1000);
  delete msg.date;

  this.chat = new Chat().parse(msg.chat, options);
  delete msg.chat;

  if (msg.from !== undefined) {
    this.from = new Chat().parseUser(msg.from, options);
    delete msg.from;
  } else {
    if (this.chat.type !== "channel") throw new Error("From not present but not sent on channel");
    this.from = this.chat;
  }

  if (msg.forward_date !== undefined) {
    this.forward = {
      date: new Date(checkInt(msg.forward_date) * 1000)
    };
    delete msg.forward_date;

    if (msg.forward_from !== undefined) {
      this.forward.from = new Chat().parseUser(msg.forward_from, options);
      delete msg.forward_from;
    }

    if (msg.forward_from_chat !== undefined) {
      this.forward.chat = new Chat().parse(msg.forward_from_chat, options);
      delete msg.forward_from_chat;
    }

    if (msg.forward_from_message_id !== undefined) {
      this.forward.id = checkInt(msg.forward_from_message_id);
      delete msg.forward_from_message_id;
    }
  }

  if (msg.reply_to_message !== undefined) {
    this.reply = new Message().parse(msg.reply_to_message, options);
    delete msg.reply_to_message;
  }

  if (msg.edit_date !== undefined) {
    this.editDate = new Date(checkInt(msg.edit_date) * 1000);
    delete msg.edit_date;
  }

  if (this.chat.type === "group" || this.chat.type === "supergroup") {
    this.group = this.chat;
  } else if (this.chat.type === "user") {
    this.user = this.chat;
  }

  for (var type in messageTypes) {
    if (!messageTypes.hasOwnProperty(type)) continue;
    if (!messageTypes[type].call(this, msg, options)) continue;
    if (this.type) throw new Error("duplicate types found in message!");
    this.type = type;
    if (!options.strict) break;
  }

  if (this.type === undefined)
    this.unparsed = msg;
  else
    utils.verifyEmpty(msg, options);

  return this;
};

var messageTypes = {

  "text": function (msg, options) {
    if (msg.text === undefined) return false;

    this.text = checkStr(msg.text);
    delete msg.text;

    var entities = (msg.entities === undefined) ? [] : checkArr(msg.entities);
    delete msg.entities;
    this.entities = entities.map(function (entity) {
      return new MessageEntity().parse(entity, options);
    });

    this.mentions = parseGenericEntity.call(this, "mention", "@");
    this.hashtags = parseGenericEntity.call(this, "hashtag", "#");
    parseCommand(this);

    function parseGenericEntity(type, prefix) {
      var raw = [];
      this.entities.forEach(function (entity) {
        if (entity.type !== type) return;
        var str = this.text.substring(entity.offset, entity.offset + entity.length);
        if (str.length < prefix.length || str.substring(0, prefix.length) !== prefix)
          throw new Error("Expected prefix for " + type + ": " + str);
        raw.push(str.substring(prefix.length));
      }.bind(this));

      function func(x) {
        if (!x) return func.raw;
        if (x.substring(0, prefix.length) === prefix)
          x = x.substring(prefix.length);
        var n = 0;
        func.raw.forEach(function (username) {
          if (utils.equalsIgnoreCase(username, x)) n++;
        });
        return n;
      }
      func.raw = raw;
      return func;
    }

    return true;
  },

  "audio": function (msg, options) {
    if (msg.audio === undefined) return false;
    var audio = checkObj(msg.audio);
    delete msg.audio;

    this.duration = checkInt(audio.duration);
    delete audio.duration;

    this.file = new File().parseLight(audio, options);

    if (audio.performer !== undefined) {
      this.performer = checkStr(audio.performer);
      delete audio.performer;
    }

    if (audio.title !== undefined) {
      this.title = checkStr(audio.title);
      delete audio.title;
    }

    utils.verifyEmpty(audio, options);
    return true;
  },

  "document": function (msg, options) {
    if (msg.document === undefined) return false;
    var document = checkObj(msg.document);
    delete msg.document;

    this.file = new File().parseLight(document, options);

    if (document.file_name !== undefined) {
      this.filename = checkStr(document.file_name);
      delete document.file_name;
    }

    if (document.thumb !== undefined) {
      this.thumbnail = new Image().parse(document.thumb, options);
      delete document.thumb;
    }

    utils.verifyEmpty(document, options);
    return true;
  },

  "photo": function (msg, options) {
    if (msg.photo === undefined) return false;
    parsePhoto.call(this, msg.photo, options);
    delete msg.photo;

    if (msg.caption !== undefined) {
      this.caption = checkStr(msg.caption);
      if (options.strict && this.caption.length > 200)
        throw new Error("Caption too long.");
      delete msg.caption;
    }

    return true;
  },

  "sticker": function (msg, options) {
    if (msg.sticker === undefined) return false;

    // Parsing for this type is done on a dedicated function
    Sticker.prototype.parse.call(this, msg.sticker, options);
    delete msg.sticker;

    return true;
  },

  "video": function (msg, options) {
    if (msg.video === undefined) return false;
    var video = checkObj(msg.video);
    delete msg.video;

    this.file = new File().parseLight(video, options);

    this.width = checkInt(video.width);
    delete video.width;

    this.height = checkInt(video.height);
    delete video.height;

    this.duration = checkInt(video.duration);
    delete video.duration;

    if (video.thumb !== undefined) {
      this.thumbnail = new Image().parse(video.thumb, options);
      delete video.thumb;
    }

    if (msg.caption !== undefined) {
      this.caption = checkStr(msg.caption);
      if (options.strict && this.caption.length > 200)
        throw new Error("Caption too long.");
      delete msg.caption;
    }

    utils.verifyEmpty(video, options);
    return true;
  },

  "videoNote": function (msg, options) {
    if (msg.video_note === undefined) return false;
    var note = checkObj(msg.video_note);
    delete msg.video_note;

    this.file = new File().parseLight(note, options);

    this.duration = checkInt(note.duration);
    delete note.duration;

    this.length = checkInt(note.length);
    delete note.length;

    if (note.thumb !== undefined) {
      this.thumbnail = new Image().parse(note.thumb, options);
      delete note.thumb;
    }

    utils.verifyEmpty(note, options);
    return true;
  },

  "voice": function (msg, options) {
    if (msg.voice === undefined) return false;
    var voice = checkObj(msg.voice);
    delete msg.voice;

    this.file = new File().parseLight(voice, options);

    this.duration = checkInt(voice.duration);
    delete voice.duration;

    utils.verifyEmpty(voice, options);
    return true;
  },

  "contact": function (msg, options) {
    if (msg.contact === undefined) return false;
    var contact = checkObj(msg.contact);
    delete msg.contact;

    this.phone = checkStr(contact.phone_number);
    delete contact.phone_number;

    this.firstname = checkStr(contact.first_name);
    delete contact.first_name;

    if (contact.last_name !== undefined) {
      this.lastname = checkStr(contact.last_name);
      delete contact.last_name;
    }

    if (contact.user_id !== undefined) {
      this.userId = checkInt(contact.user_id);
      delete contact.user_id;
    }

    utils.verifyEmpty(contact, options);
    return true;
  },

  "location": function (msg, options) {
    // FIXME: for backwards compatibility, remove when no longer needed
    if (msg.venue !== undefined) return false;

    if (msg.location === undefined) return false;
    var location = checkObj(msg.location);
    delete msg.location;

    this.longitude = checkNum(location.longitude);
    delete location.longitude;

    this.latitude = checkNum(location.latitude);
    delete location.latitude;

    utils.verifyEmpty(location, options);
    return true;
  },

  "venue": function (msg, options) {
    if (msg.venue === undefined) return false;
    var venue = checkObj(msg.venue);
    delete msg.venue;
    // FIXME: for backwards compatibility, remove when no longer needed
    delete msg.location;

    this.location = new Location().parse(venue.location, options);
    delete venue.location;

    this.title = checkStr(venue.title);
    delete venue.title;

    this.address = checkStr(venue.address);
    delete venue.address;

    if (venue.foursquare_id !== undefined) {
      this.foursquareId = checkStr(venue.foursquare_id);
      delete venue.foursquare_id;
    }

    utils.verifyEmpty(venue, options);
    return true;
  },

  "game": function (msg, options) {
    if (msg.game === undefined) return false;
    var game = checkObj(msg.game);
    delete msg.game;

    this.title = checkStr(game.title);
    delete game.title;

    this.description = checkStr(game.description);
    delete game.description;

    this.photo = parsePhoto.call({}, game.photo, options);
    delete game.photo;

    if (game.text !== undefined) {
      this.text = checkStr(game.text);
      delete game.text;

      var entities = (game.text_entities === undefined) ? [] : checkArr(game.text_entities);
      delete game.text_entities;
      this.entities = entities.map(function (entity) {
        return new MessageEntity().parse(entity, options);
      });
    }

    if (game.animation !== undefined) {
      this.animation = new Animation().parse(game.animation, options);
      delete game.animation;
    }

    utils.verifyEmpty(game, options);
    return true;
  },

  "update": function (msg, options) {
    if (msg.new_chat_members !== undefined) {
      this.subject = "member", this.action = "new";
      this.members = checkArr(msg.new_chat_members).map(function (user) {
        return new Chat().parseUser(user, options);
      });
      delete msg.new_chat_members;
      // FIXME: fix for backwards compatibility, remove when no longer needed
      delete msg.new_chat_member;
      // FIXME: for backwards compatibility, remove when no longer needed
      delete msg.new_chat_participant;
      return true;
    }

    if (msg.left_chat_member !== undefined) {
      this.subject = "member", this.action = "leave";
      this.member = new Chat().parseUser(msg.left_chat_member, options);
      delete msg.left_chat_member;
      // FIXME: for backwards compatibility, remove when no longer needed
      delete msg.left_chat_participant;
      return true;
    }

    if (msg.new_chat_title !== undefined) {
      this.subject = "title", this.action = "new";
      this.title = checkStr(msg.new_chat_title);
      delete msg.new_chat_title;
      return true;
    }

    if (msg.new_chat_photo !== undefined) {
      this.subject = "photo", this.action = "new";
      this.photo = parsePhoto.call({}, msg.new_chat_photo, options);
      delete msg.new_chat_photo;
      return true;
    }

    if (msg.delete_chat_photo !== undefined) {
      this.subject = "photo", this.action = "delete";
      if (msg.delete_chat_photo !== true) throw new Error("Expected true");
      delete msg.delete_chat_photo;
      return true;
    }

    if (msg.group_chat_created !== undefined) {
      this.subject = "chat", this.action = "create";
      if (msg.group_chat_created !== true) throw new Error("Expected true");
      if (this.chat.type !== "group") throw new Error("Expected group chat");
      delete msg.group_chat_created;
      return true;
    }

    if (msg.supergroup_chat_created !== undefined) {
      this.subject = "chat", this.action = "create";
      if (msg.supergroup_chat_created !== true) throw new Error("Expected true");
      if (this.chat.type !== "supergroup") throw new Error("Expected supergroup chat");
      delete msg.supergroup_chat_created;
      return true;
    }

    if (msg.channel_chat_created !== undefined) {
      this.subject = "chat", this.action = "create";
      if (msg.channel_chat_created !== true) throw new Error("Expected true");
      if (this.chat.type !== "channel") throw new Error("Expected channel chat");
      delete msg.channel_chat_created;
      return true;
    }

    if (msg.migrate_to_chat_id !== undefined) {
      this.subject = "chat", this.action = "migrateTo";
      this.toId = checkInt(msg.migrate_to_chat_id);
      delete msg.migrate_to_chat_id;
      return true;
    }

    if (msg.migrate_from_chat_id !== undefined) {
      this.subject = "chat", this.action = "migrateFrom";
      this.fromId = checkInt(msg.migrate_from_chat_id);
      delete msg.migrate_from_chat_id;
      return true;
    }

    if (msg.pinned_message !== undefined) {
      this.subject = "message", this.action = "pin";
      this.message = new Message().parse(msg.pinned_message, options);
      delete msg.pinned_message;
      return true;
    }

    return false;
  },

};
Message.types = Object.keys(messageTypes);

MessageEntity.prototype.parse = function parse(entity, options) {
  checkObj(entity);

  this.type = checkStr(entity.type);
  delete entity.type;

  this.offset = checkInt(entity.offset);
  delete entity.offset;

  this.length = checkInt(entity.length);
  delete entity.length;

  if (entity.url !== undefined) {
    this.url = checkStr(entity.url);
    delete entity.url;
  }

  if (entity.user !== undefined) {
    this.user = new Chat().parseUser(entity.user, options);
    delete entity.user;
  }

  utils.verifyEmpty(entity, options);
  return this;
};

Chat.prototype.parse = function parse(chat, options) {
  checkObj(chat);

  this.id = checkInt(chat.id);
  delete chat.id;

  this.type = chatTypes[checkStr(chat.type)];
  if (options.strict && !this.type)
    throw new Error("Unknown chat type");
  delete chat.type;

  if (chat.title !== undefined) {
    this.title = checkStr(chat.title);
    delete chat.title;
  }

  if (chat.first_name !== undefined) {
    this.firstname = checkStr(chat.first_name);
    delete chat.first_name;
  }

  if (chat.last_name !== undefined) {
    this.lastname = checkStr(chat.last_name);
    delete chat.last_name;
  }

  if (chat.username !== undefined) {
    this.username = checkStr(chat.username);
    delete chat.username;
  }

  if (chat.language_code !== undefined) {
    this.language = checkStr(chat.language_code);
    delete chat.language_code;
  }

  if (chat.all_members_are_administrators !== undefined) {
    this.allMembersAreAdmins = checkBool(chat.all_members_are_administrators);
    delete chat.all_members_are_administrators;
  }

  if (chat.photo !== undefined) {
    checkObj(chat.photo);

    this.smallPhoto = new File();
    this.smallPhoto.id = checkStr(chat.photo.small_file_id);
    delete chat.photo.small_file_id;

    this.bigPhoto = new File();
    this.bigPhoto.id = checkStr(chat.photo.big_file_id);
    delete chat.photo.big_file_id;

    utils.verifyEmpty(chat.photo, options);
    delete chat.photo;
  }

  if (chat.description !== undefined) {
    this.description = checkStr(chat.description);
    delete chat.description;
  }

  if (chat.invite_link !== undefined) {
    this.inviteLink = checkStr(chat.invite_link);
    delete chat.invite_link;
  }

  this.name = this.title;
  if (!this.name) {
    this.name = this.firstname;
    if (this.lastname) this.name += " " + this.lastname;
  }

  if (options.strict && this.verify() === false)
    throw new Error("Unexpected fields in " + this.type + " chat.");
  utils.verifyEmpty(chat, options);
  return this;
};

Chat.prototype.verify = function () {
  if ((this.type === "group") != (this.allMembersAreAdmins !== undefined))
    return false;

  if (this.type === "user")
    return this.title === undefined && this.firstname !== undefined;
  if (this.type === "group" || this.type === "supergroup")
    return this.firstname === undefined && this.lastname === undefined && this.username === undefined;
  if (this.type === "channel")
    return this.firstname === undefined && this.lastname === undefined && this.username !== undefined;
  return true;
};

Chat.prototype.parseUser = function parseUser(user, options) {
  checkObj(user);
  user.type = "private";
  return this.parse(user, options);
};

var chatTypes = {
  "private": "user",
  "group": "group",
  "supergroup": "supergroup",
  "channel": "channel"
};
Chat.types = Object.keys(chatTypes).map(function (key) { return chatTypes[key]; });

File.prototype.parseLight = function parseLight(file, options) {
  checkObj(file);

  this.id = checkStr(file.file_id);
  delete file.file_id;

  if (file.file_size !== undefined) {
    this.size = checkInt(file.file_size);
    delete file.file_size;
  }

  if (file.mime_type !== undefined) {
    this.mime = checkStr(file.mime_type);
    delete file.mime_type;
  }

  if (file.file_path !== undefined) {
    this.path = checkStr(file.file_path);
    delete file.file_path;
  }

  // silence linter
  (function() {})(options);
  return this;
};

File.prototype.parse = function parse(file, options) {
  this.parseLight(file, options);
  utils.verifyEmpty(file, options);
  return this;
};

Image.prototype.parse = function parse(size, options) {
  checkObj(size);

  this.file = new File().parseLight(size);

  this.width = checkInt(size.width);
  delete size.width;

  this.height = checkInt(size.height);
  delete size.height;

  utils.verifyEmpty(size, options);
  return this;
};

InlineQuery.prototype.parse = function parse(query, options) {
  checkObj(query);

  this.id = checkStr(query.id);
  delete query.id;

  this.from = new Chat().parseUser(query.from, options);
  delete query.from;

  if (query.location !== undefined) {
    this.location = new Location().parse(query.location, options);
    delete query.location;
  }

  this.query = checkStr(query.query);
  delete query.query;

  this.offset = checkStr(query.offset);
  delete query.offset;

  utils.verifyEmpty(query, options);
  return this;
};

ChosenInlineResult.prototype.parse = function parse(choice, options) {
  checkObj(choice);
  
  this.id = checkStr(choice.id);
  delete choice.id;

  this.from = new Chat().parseUser(choice.from, options);
  delete choice.from;

  if (choice.location !== undefined) {
    this.location = new Location().parse(choice.location, options);
    delete choice.location;
  }

  if (choice.inline_message_id !== undefined) {
    this.inlineMessageId = checkStr(choice.inline_message_id);
    delete choice.inline_message_id;
  }

  this.query = checkStr(choice.query);
  delete choice.query;

  utils.verifyEmpty(choice, options);
  return this;
};

Location.prototype.parse = function parse(location, options) {
  checkObj(location);

  this.longitude = checkNum(location.longitude);
  delete location.longitude;

  this.latitude = checkNum(location.latitude);
  delete location.latitude;

  utils.verifyEmpty(location, options);
  return this;
};

CallbackQuery.prototype.parse = function parse(query, options) {
  checkObj(query);

  this.id = checkStr(query.id);
  delete query.id;

  this.from = new Chat().parseUser(query.from, options);
  delete query.from;

  if (query.message !== undefined) {
    this.message = new Message().parse(query.message, options);
    delete query.message;
  }

  if (query.inline_message_id !== undefined) {
    this.inlineMessageId = checkStr(query.inline_message_id);
    delete query.inline_message_id;
  }

  if (query.chat_instance !== undefined) {
    this.chatInstance = checkStr(query.chat_instance);
    delete query.chat_instance;
  }

  if (query.data !== undefined) {
    this.data = checkStr(query.data);
    delete query.data;
  }

  if (query.game_short_name !== undefined) {
    this.gameShortName = checkStr(query.game_short_name);
    delete query.game_short_name;
  }

  utils.verifyEmpty(query, options);
  return this;
};

ChatMember.prototype.parse = function parse(member, options) {
  checkObj(member);

  this.user = new Chat().parseUser(member.user, options);
  delete member.user;

  this.status = checkStr(member.status);
  delete member.status;

  if (member.until_date !== undefined) {
    this.until = new Date(member.until_date * 1000);
    delete member.until_date;
  }

  if (member.can_be_edited !== undefined) {
    this.editAllowed = checkBool(member.can_be_edited);
    delete member.can_be_edited;
  }

  this.privileges = {};

  if (member.can_change_info !== undefined) {
    this.privileges.changeInfo = checkBool(member.can_change_info);
    delete member.can_change_info;
  }

  if (member.can_post_messages !== undefined) {
    this.privileges.messagePost = checkBool(member.can_post_messages);
    delete member.can_post_messages;
  }

  if (member.can_edit_messages !== undefined) {
    this.privileges.messageEdit = checkBool(member.can_edit_messages);
    delete member.can_edit_messages;
  }

  if (member.can_delete_messages !== undefined) {
    this.privileges.messageDelete = checkBool(member.can_delete_messages);
    delete member.can_delete_messages;
  }

  if (member.can_invite_users !== undefined) {
    this.privileges.userInvite = checkBool(member.can_invite_users);
    delete member.can_invite_users;
  }

  if (member.can_restrict_members !== undefined) {
    this.privileges.memberRestrict = checkBool(member.can_restrict_members);
    delete member.can_restrict_members;
  }

  if (member.can_pin_messages !== undefined) {
    this.privileges.messagePin = checkBool(member.can_pin_messages);
    delete member.can_pin_messages;
  }

  if (member.can_promote_members !== undefined) {
    this.privileges.memberPromote = checkBool(member.can_promote_members);
    delete member.can_promote_members;
  }

  if (member.can_send_messages !== undefined) {
    this.privileges.messageSend = checkBool(member.can_send_messages);
    delete member.can_send_messages;
  }

  if (member.can_send_media_messages !== undefined) {
    this.privileges.messageSendMedia = checkBool(member.can_send_media_messages);
    delete member.can_send_media_messages;
  }

  if (member.can_send_other_messages !== undefined) {
    this.privileges.messageSendOther = checkBool(member.can_send_other_messages);
    delete member.can_send_other_messages;
  }

  if (member.can_add_web_page_previews !== undefined) {
    this.privileges.webPreviewAllow = checkBool(member.can_add_web_page_previews);
    delete member.can_add_web_page_previews;
  }

  utils.verifyEmpty(member, options);
  return this;
};

Animation.prototype.parse = function parse(animation, options) {
  checkObj(animation);

  this.file = new File().parseLight(animation);

  if (animation.file_name !== undefined) {
    this.filename = checkStr(animation.file_name);
    delete animation.file_name;
  }

  if (animation.thumb !== undefined) {
    this.thumbnail = new Image().parse(animation.thumb, options);
    delete animation.thumb;
  }

  utils.verifyEmpty(animation, options);
  return this;
};

GameHighScore.prototype.parse = function parse(highScore, options) {
  checkObj(highScore);

  this.position = checkInt(highScore.position);
  delete highScore.position;

  this.user = new Chat().parseUser(highScore.user, options);
  delete highScore.user;

  this.score = checkInt(highScore.score);
  delete highScore.score;

  utils.verifyEmpty(highScore, options);
  return this;
};

MaskPosition.prototype.parse = function parse(maskPosition, options) {
  checkObj(maskPosition);

  this.point = checkStr(maskPosition.point);
  delete maskPosition.point;

  this.shift = {};
  this.shift.x = checkNum(maskPosition.x_shift);
  delete maskPosition.x_shift;
  this.shift.y = checkNum(maskPosition.y_shift);
  delete maskPosition.y_shift;

  this.scale = checkNum(maskPosition.scale);
  delete maskPosition.scale;

  utils.verifyEmpty(maskPosition, options);
  return this;
};

Sticker.prototype.parse = function parse(sticker, options) {
  checkObj(sticker);

  this.file = new File().parseLight(sticker, options);

  this.width = checkInt(sticker.width);
  delete sticker.width;

  this.height = checkInt(sticker.height);
  delete sticker.height;

  if (sticker.thumb !== undefined) {
    this.thumbnail = new Image().parse(sticker.thumb, options);
    delete sticker.thumb;
  }

  if (sticker.emoji !== undefined) {
    this.emoji = checkStr(sticker.emoji);
    delete sticker.emoji;
  }

  if (sticker.set_name !== undefined) {
    this.setName = checkStr(sticker.set_name);
    delete sticker.set_name;
  }

  if (sticker.mask_position !== undefined) {
    this.maskPosition = new MaskPosition().parse(sticker.mask_position, options);
    delete sticker.maskPosition;
  }

  utils.verifyEmpty(sticker, options);
  return this;
};

StickerSet.prototype.parse = function parse(stickerSet, options) {
  checkObj(stickerSet);

  this.name = checkStr(stickerSet.name);
  delete stickerSet.name;

  this.title = checkStr(stickerSet.title);
  delete stickerSet.title;

  this.containsMasks = checkBool(stickerSet.contains_masks);
  delete stickerSet.contains_masks;

  this.stickers = checkArr(stickerSet.stickers).map(function (sticker) {
    return new Sticker().parse(sticker, options);
  });
  delete stickerSet.stickers;

  utils.verifyEmpty(stickerSet, options);
  return this;
};

function parsePhoto(photo, options) {
  checkArr(photo);

  if (photo.length === 0)
    throw new Error("Photo contains no sizes");

  this.sizes = photo.map(function (size) {
    return new Image().parse(size, options);
  });

  this.image = this.sizes.reduce(function (a, b) {
    var areaA = a.width * a.height, areaB = b.width * b.height;
    if (options.strict && areaA === areaB)
      throw new Error("Areas of two sizes match!");
    return (areaB > areaA) ? b : a;
  });

  return this;
}

// Resolving functions

function resolveFile(file) {
  if (file instanceof File) file = file.id;
  if (!utils.isStr(file))
    throw new Error("Invalid file ID");
  return file;
}

function resolveChat(chat) {
  if (chat instanceof Chat) chat = chat.id;
  if (!utils.isInt(chat))
    throw new Error("Invalid chat ID");
  return chat;
}

function resolveMessage(msg) {
  if (msg instanceof Message) msg = msg.id;
  if (!utils.isInt(msg))
    throw new Error("Invalid message ID");
  return msg;
}

function resolveSticker(sticker) {
  if (sticker instanceof Sticker) sticker = sticker.file;
  if (sticker instanceof File) sticker = sticker.id;
  if (!utils.isStr(sticker))
    throw new Error("Invalid sticker/file ID");
  return sticker;
}

function resolveStickerSet(stickerSet) {
  if (stickerSet instanceof StickerSet) stickerSet = stickerSet.name;
  if (!utils.isStr(stickerSet))
    throw new Error("Invalid sticker set [name] was passed");
  return stickerSet;
}

// Unspecified parsing -- just trying to guess...

function parseCommand(msg) {
  //FIXME: could we use entities to parse the command as well? Not clear how we would extract username...
  var text = msg.text;
  var match = /^\/([a-z0-9_]+)(@[a-z]\w*(_\w+)*)?([ \f\n\r\t\v\u00A0\u2028\u2029]+(.*))?$/i.exec(text);
  if (!match) return;

  msg.command = match[1];
  if (match[2]) msg.username = match[2].substring(1);

  var args = match[5] || "";
  var func = function args(x) {
    if (!x) return func.raw;
    if (!func.raw.length) return [];
    var str = func.raw, ret = [], idx;
    while (--x > 0 && (idx = str.search(/\s/)) !== -1) {
      if (idx) ret.push(str.substring(0, idx));
      str = str.substring(idx + 1);
    }
    ret.push(str);
    return ret;
  };
  func.raw = args;
  msg.args = func;
}

function formatCommand(username, command, args) {
  if (command[0] !== "/") command = "/" + command;
  if (username && username[0] !== "@") username = "@" + username;
  if (args instanceof Array) args = args.join(" ");
  else args = args.toString();

  var text = command;
  if (username) text += username;
  if (args) text += " " + args;
  return text;
}

function formatKeyboard(keys) {
  return checkArr(keys).map(function (row) {
    if (!utils.isArr(row)) row = [row];
    return row.map(function (key) {
      if (utils.isStr(key)) key = { text: key };
      var result = { text: key.text.toString() };
      if (key.request === "contact") result.request_contact = true;
      if (key.request === "location") result.request_location = true;
      return result;
    });
  });
}



exports.Message = Message;
exports.MessageEntity = MessageEntity;
exports.Chat = Chat;
exports.File = File;
exports.Image = Image;
exports.InlineQuery = InlineQuery;
exports.ChosenInlineResult = ChosenInlineResult;
exports.Location = Location;
exports.CallbackQuery = CallbackQuery;
exports.ChatMember = ChatMember;
exports.Animation = Animation;
exports.GameHighScore = GameHighScore;
exports.MaskPosition = MaskPosition;
exports.Sticker = Sticker;
exports.StickerSet = StickerSet;
exports.resolveFile = resolveFile;
exports.resolveChat = resolveChat;
exports.resolveMessage = resolveMessage;
exports.resolveSticker = resolveSticker;
exports.resolveStickerSet = resolveStickerSet;
exports.parsePhoto = parsePhoto;
exports.parseCommand = parseCommand;
exports.formatCommand = formatCommand;
exports.formatKeyboard = formatKeyboard;
