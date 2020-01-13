// Some basic utilities used internally.

var stream = require("stream");
var util = require("util");

function equalsIgnoreCase(a, b) {
  // not ideal, but...
  return a.toUpperCase() === b.toUpperCase();
}

function verifyEmpty(obj, options) {
  if (options.strict && Object.keys(obj).length)
    throw new Error("There were unparsed keys:\n" + util.inspect(obj));
}

/*global Promise*/
function promiseInvoke(method, that, args) {
  args = [].slice.call(arguments, 2);
  return new Promise(function (resolve, reject) {
    args.push(function (err, result) {
      if (err) return reject(err);
      return resolve(result);
    });
    method.apply(that, args);
  });
}

var checkers = {};

checkers.Int = function (x) {
  return typeof x === "number" && x === Math.floor(x);
};

checkers.Num = function (x) {
  return typeof x === "number";
};

checkers.Obj = function (x) {
  return typeof x === "object" && x !== null;
};

checkers.Str = function (x) {
  return typeof x === "string" || x instanceof String;
};

checkers.Arr = function (x) {
  return x instanceof Array;
};

checkers.Bool = function (x) {
  return x === true || x === false;
};

checkers.Buffer = function (x) {
  return x instanceof Buffer;
};

checkers.Readable = function (x) {
  return x instanceof stream.Readable;
};

checkers.Writable = function (x) {
  return x instanceof stream.Writable;
};

checkers.Func = function (x) {
  return typeof x === "function";
};

checkers.Regex = function (x) {
  return x instanceof RegExp;
};



exports.promiseInvoke = promiseInvoke;
exports.equalsIgnoreCase = equalsIgnoreCase;
exports.verifyEmpty = verifyEmpty;
Object.keys(checkers).forEach(function (key) {
  exports["is" + key] = checkers[key];
  exports["check" + key] = function checkType(x) {
    if (checkers[key](x)) return x;
    throw new Error(key + " expected");
  };
});
