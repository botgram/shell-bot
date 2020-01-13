var TermState = Terminal.TermState;
function newTerminal(w, h) {
	var t = new TermState({rows:h, columns:w}), tw = new Terminal(t);
	t.setMode('crlf', true);
	return tw;
}
describe('Terminal SGI', function() {
	it("resets attributes", function() {
		var t = newTerminal();
		t.write("\x1b[1mbb\x1b[mn");
		var line = t.state.getLine(0);
		expect(line.str).to.be('bbn');
		expect(line.attr[0].bold).to.be(true);
		expect(line.attr[1]).to.be(undefined);
		expect(line.attr[2].bold).to.be(false);
	});
	it("sets bold", function() {
		var t = newTerminal();
		t.write("\x1b[1mb");
		var line = t.state.getLine(0);
		expect(line.str).to.be('b');
		expect(line.attr[0].bold).to.be(true);
	});
});
