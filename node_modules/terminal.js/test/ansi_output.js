var TermState = Terminal.TermState;
var AnsiOutput = Terminal.output.AnsiOutput;
function newTerminal(w, h) {
	var t = new TermState({rows:h, columns:w}), tw = new Terminal(t);
	t.setMode('crlf', true);
	return tw;
}
describe('AnsiOutput', function() {
	it("basic write test", function() {
		var t = newTerminal();
		var r = new AnsiOutput(t.state);
		t.write("Hello");

		//expect(r.toString()).to.be('\u001b[22;23;24;25;27mHello\u001b[0m');
		expect(r.toString()).to.contain('\u001b[22;23;24;25;27mHello\u001b[22;23;24;25;7m ');
		t.state.setCursor(0,0);
		expect(r.toString()).to.contain('\u001b[22;23;24;25;7mH\u001b[22;23;24;25;27mello');
	});
});
