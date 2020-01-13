module.exports = require("./lib/terminal.js");

module.exports.TermState = require("./lib/term_state.js");
module.exports.TermDiff = require("./lib/term_diff.js");
module.exports.output = {
	PlainOutput: require("./lib/output/plain.js"),
	AnsiOutput: require("./lib/output/ansi.js"),
	TtyOutput: require("./lib/output/tty.js"),
	HtmlOutput: require("./lib/output/html.js"),
	DomOutput: require("./lib/output/dom.js")
};

module.exports.source = {
	EmitterSource: require("./lib/source/emitter.js")
};

module.exports.input = {
	DomInput: require('./lib/input/dom.js'),
	TtyInput: require('./lib/input/tty.js'),
};
