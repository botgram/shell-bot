// Implements miscellaneous functions on the bot object.

var utils = require("./utils");
var https = require("https");
var model = require("./model");

function initMisc() {
  this.fileGet = fileGet;
  this.fileLink = fileLink;
  this.fileStream = fileStream;
  this.fileLoad = fileLoad;
  this.getChat = getChat;
  this.getProfilePhotos = getProfilePhotos;
  this.setChatPhoto = setChatPhoto;
  this.deleteChatPhoto = deleteChatPhoto;
  this.setChatTitle = setChatTitle;
  this.setChatDescription = setChatDescription;
  this.pinChatMessage = pinChatMessage;
  this.unpinChatMessage = unpinChatMessage;
  this.exportChatInviteLink = exportChatInviteLink;
  this.kickMember = kickMember;
  this.unbanMember = unbanMember;
  this.leaveChat = leaveChat;
  this.getChatAdministrators = getChatAdministrators;
  this.getChatMembersCount = getChatMembersCount;
  this.getChatMember = getChatMember;
  this.promoteChatMember = promoteChatMember;
  this.restrictChatMember = restrictChatMember;
  this.linkGame = linkGame;
  this.setGameScore = setGameScore;
  this.getGameHighScores = getGameHighScores;
  this.getStickerSet = getStickerSet;
  this.uploadStickerFile = uploadStickerFile;
  this.createNewStickerSet = createNewStickerSet;
  this.addStickerToSet = addStickerToSet;
  this.setStickerPositionInSet = setStickerPositionInSet;
  this.deleteStickerFromSet = deleteStickerFromSet;
  this.link = link;
  this.linkGroup = linkGroup;
  this.formatCommand = formatCommand;
}

// File download

function fileGet(file, cb) {
  // Undocumented feature: sometimes the file_path property may be
  // given to you without having to call getFile [again].
  if (file instanceof model.File && file.path) return cb(null, file);

  this.callMethod("getFile", {file_id: model.resolveFile(file)}, function (err, result) {
    if (err) return cb(err);
    cb(null, new model.File().parse(result, this.options));
  }.bind(this));
}

function fileLink(path) {
  if (path instanceof model.File) path = path.path;
  return "https://api.telegram.org/file/bot" + this.authToken + "/" + path;
}

function fileStream(file, cb) {
  this.fileGet(file, function (err, info) {
    if (err) return cb(err);
    https.get(this.fileLink(info), function (res) {
      cb(null, res);
    }).on("error", cb);
  }.bind(this));
}

function fileLoad(file, cb) {
  this.fileStream(file, function (err, stream) {
    if (err) return cb(err);
    var chunks = [];
    stream.on("error", cb);
    stream.on("readable", function () {
      var chunk = stream.read();
      if (chunk) chunks.push(chunk);
    });
    stream.on("end", function () {
      cb(null, Buffer.concat(chunks));
    });
  }.bind(this));
}

// Chat info

function getChat(chat, cb) {
  if (utils.isStr(chat)) {
    if (chat[0] !== "@") chat = "@" + chat;
  } else {
    chat = model.resolveChat(chat);
  }
  this.callMethod("getChat", {chat_id: chat}, function (err, result) {
    if (err) return cb(err);
    cb(null, new model.Chat().parse(result, this.options));
  }.bind(this));
}

function getProfilePhotos(user, range, cb) {
  if (arguments.length === 2) cb = range, range = null;

  var parameters = {user_id: model.resolveChat(user)};
  if (range) {
    utils.checkArr(range);
    if (range[1] < 1 || range[1] > 100) throw new Error("Invalid photo range");
    parameters.offset = utils.checkInt(range[0]);
    parameters.limit = utils.checkInt(range[1]);
  }
  this.callMethod("getUserProfilePhotos", parameters, function (err, result) {
    if (err) return cb(err);

    utils.checkObj(result);

    var photos = utils.checkArr(result.photos);
    delete result.photos;
    photos = photos.map(function (photo) {
      return model.parsePhoto.call({}, photo, this.options);
    }.bind(this));

    photos.total = utils.checkInt(result.total_count);
    delete result.total_count;

    utils.verifyEmpty(result, this.options);
    cb(null, photos);
  }.bind(this));
}

function setChatPhoto(chat, file, cb) {
  this.callMethod("setChatPhoto", {
    chat_id: model.resolveChat(chat),
    photo: model.resolveFile(file),
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function deleteChatPhoto(chat, cb) {
  this.callMethod("deleteChatPhoto", {
    chat_id: model.resolveChat(chat),
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function setChatTitle(chat, title, cb) {
  this.callMethod("setChatTitle", {
    chat_id: model.resolveChat(chat),
    title: utils.checkStr(title),
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function setChatDescription(chat, description, cb) {
  if (description !== false) utils.checkStr(description);
  else description = undefined;

  this.callMethod("setChatDescription", {
    chat_id: model.resolveChat(chat),
    description: description,
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function pinChatMessage(chat, message, options, cb) {
  this.callMethod("pinChatMessage", {
    chat_id: model.resolveChat(chat),
    message_id: model.resolveMessage(message),
    disable_notification: !!options.disableNotification,
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function unpinChatMessage(chat, cb) {
  this.callMethod("unpinChatMessage", {
    chat_id: model.resolveChat(chat),
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

// Chat membership

function exportChatInviteLink(chat, cb) {
  this.callMethod("exportChatInviteLink", {
    chat_id: model.resolveChat(chat),
  }, function (err, result) {
    if (err) return cb(err);
    cb(null, utils.checkStr(result));
  }.bind(this));
}

function kickMember(chat, user, until, cb) {
  if (cb === undefined && utils.isFunc(until)) {
    cb = until;
    until = undefined;
  }

  if (utils.isNum(until))
    until = new Date(Date.now() + until * 1000);

  if (until !== undefined) {
    if (until instanceof Date)
      until = until.getTime() / 1000;
    else
      throw new Error("'until' isn't a valid Date");
  }

  this.callMethod("kickChatMember", {
    chat_id: model.resolveChat(chat),
    user_id: model.resolveChat(user),
    until_date: until,
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function unbanMember(chat, user, cb) {
  this.callMethod("unbanChatMember", {chat_id: model.resolveChat(chat), user_id: model.resolveChat(user)}, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function leaveChat(chat, cb) {
  this.callMethod("leaveChat", {chat_id: model.resolveChat(chat)}, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function getChatAdministrators(chat, cb) {
  this.callMethod("getChatAdministrators", {chat_id: model.resolveChat(chat)}, function (err, result) {
    if (err) return cb(err);
    var members = utils.checkArr(result).map(function (member) {
      return new model.ChatMember().parse(member, this.options);
    }.bind(this));
    cb(null, members);
  }.bind(this));
}

function getChatMembersCount(chat, cb) {
  this.callMethod("getChatMembersCount", {chat_id: model.resolveChat(chat)}, function (err, result) {
    if (err) return cb(err);
    cb(null, utils.checkInt(result));
  }.bind(this));
}

function getChatMember(chat, user, cb) {
  this.callMethod("getChatMember", {chat_id: model.resolveChat(chat), user_id: model.resolveChat(user)}, function (err, result) {
    if (err) return cb(err);
    cb(null, new model.ChatMember().parse(result, this.options));
  }.bind(this));
}

function promoteChatMember(chat, user, privileges, cb) {
  this.callMethod("promoteChatMember", {
    chat_id: model.resolveChat(chat),
    user_id: model.resolveChat(user),
    can_change_info: privileges.infoChange,
    can_post_messages: privileges.messagePost,
    can_edit_messages: privileges.messageEdit,
    can_delete_messages: privileges.messageDelete,
    can_invite_users: privileges.userInvite,
    can_restrict_members: privileges.memberRestrict,
    can_pin_messages: privileges.messagePin,
    can_promote_members: privileges.memberPromote,
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

function restrictChatMember(chat, user, privileges, until, cb) {
  if (cb === undefined && utils.isFunc(until)) {
    cb = until;
    until = undefined;
  }

  if (utils.isNum(until))
    until = new Date(Date.now() + until * 1000);

  if (until !== undefined) {
    if (until instanceof Date)
      until = until.getTime() / 1000;
    else
      throw new Error("'until' isn't a valid Date");
  }

  this.callMethod("restrictChatMember", {
    chat_id: model.resolveChat(chat),
    user_id: model.resolveChat(user),
    until_date: until,
    can_send_messages: privileges.messageSend,
    can_send_media_messages: privileges.messageSendMedia,
    can_send_other_messages: privileges.messageSendOther,
    can_add_web_page_previews: privileges.webPreviewAllow,
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) return cb(new Error("Expected true, found " + result));
    cb();
  }.bind(this));
}

// Gaming

function linkGame(gameShortName) {
  return this.link({ game: gameShortName });
}

function setGameScore(user, score, options, cb) {
  var parameters = {
    user_id: model.resolveChat(user),
    score: utils.checkInt(score),
    disable_edit_message: options.disableEditMessage,
    force: options.force,
  };
  if (options.chat)
    parameters.chat_id = model.resolveChat(options.chat);
  if (options.message) {
    if (utils.isStr(options.message))
      parameters.inline_message_id = options.message;
    else
      parameters.message_id = model.resolveMessage(options.message);
  }
  this.callMethod("setGameScore", parameters, function (err, result) {
    if (err) return cb(err);
    if (parameters.message_id) result = new model.Message().parse(result, this.options);
    cb(null, result);
  }.bind(this));
}

function getGameHighScores(user, options, cb) {
  var parameters = {
    user_id: model.resolveChat(user),
  };
  if (options.chat)
    parameters.chat_id = model.resolveChat(options.chat);
  if (options.message) {
    if (utils.isStr(options.message))
      parameters.inline_message_id = options.message;
    else
      parameters.message_id = model.resolveMessage(options.message);
  }
  this.callMethod("getGameHighScores", parameters, function (err, result) {
    if (err) return cb(err);
    result = utils.checkArr(result).map(function (highScore) {
      return new model.GameHighScore().parse(highScore, this.options);
    });
    cb(null, result);
  }.bind(this));
}

// Stickers

function getStickerSet(name, cb) {
  this.callMethod("getStickerSet", {
    name: name,
  }, function (err, result) {
    if (err) return cb(err);
    result = new model.StickerSet().parse(result, this.options);
    cb(null, result);
  }.bind(this));
}

function uploadStickerFile(user, file, cb) {
  this.callMethod("uploadStickerFile", {
    user_id: model.resolveChat(user),
    png_sticker: model.resolveFile(file),
  }, function (err, result) {
    if (err) return cb(err);
    result = new model.File().parse(result, this.options);
    cb(null, result);
  }.bind(this));
}

function createNewStickerSet(user, name, options, cb) {
  this.callMethod("createNewStickerSet", {
    user_id: model.resolveChat(user),
    name: utils.checkStr(name),
    title: utils.checkStr(options.title),
    png_sticker: model.resolveFile(options.sticker),
    emojis: utils.checkStr(options.emojis),
    contains_masks: options.containsMasks,
    mask_position: options.maskPosition,
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) throw new Error("Expected true as result");
    cb(null);
  }.bind(this));
}

function addStickerToSet(user, stickerSet, options, cb) {
  this.callMethod("addStickerToSet", {
    user_id: model.resolveChat(user),
    name: model.resolveStickerSet(stickerSet),
    png_sticker: model.resolveFile(options.sticker),
    emojis: utils.checkStr(options.emojis),
    mask_position: options.maskPosition,
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) throw new Error("Expected true as result");
    cb(null);
  }.bind(this));
}

function setStickerPositionInSet(sticker, position, cb) {
  this.callMethod("setStickerPositionInSet", {
    sticker: model.resolveSticker(sticker),
    position: utils.checkInt(position),
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) throw new Error("Expected true as result");
    cb(null);
  }.bind(this));
}

function deleteStickerFromSet(sticker, cb) {
  this.callMethod("deleteStickerFromSet", {
    sticker: model.resolveSticker(sticker),
  }, function (err, result) {
    if (err) return cb(err);
    if (result !== true) throw new Error("Expected true as result");
    cb(null);
  }.bind(this));
}

// Other

function _link(options) {
  if (!this.get("username")) throw new Error("Username still not available");
  var link = "https://" + (options.old ? "telegram.me" : "t.me") + "/" + this.get("username");
  if (options.payload !== undefined) {
    if (!/^[A-Za-z0-9_-]+$/.test(options.payload))
      throw new Error("Payload contains invalid characters");
    link += "?start" + (options.group ? "group" : "") + "=" + options.payload;
  } else if (options.game !== undefined) {
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(options.game))
      throw new Error("Game short name contains invalid characters");
    link += "?game=" + options.game;
  }
  return link;
}

function link(options, group) {
  if (utils.isStr(options)) options = { payload: options };
  if (!options) options = {};
  if (group) options.group = group;
  return _link.call(this, options);
}

function linkGroup(options) {
  return this.link(options, true);
}

function formatCommand(username, command, args) {
  if (username === true) {
    if (!this.get("username")) throw new Error("Username still not available");
    username = this.get("username");
  }
  if (!(args instanceof Array))
    args = [].slice.call(arguments, 2);
  if (username) username = username.toString();

  return model.formatCommand(username, command, args);
}



exports.initMisc = initMisc;
