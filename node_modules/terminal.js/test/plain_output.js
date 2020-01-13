var TermState = Terminal.TermState;
var PlainOutput = Terminal.output.PlainOutput;
function newTerminal(w, h) {
	var t = new Terminal({columns: w, rows: h});
	t.state.setMode('crlf', true);
	return t;
}
describe('PlainOutput', function() {
	it("basic write test", function() {
		var t = newTerminal(80,4);
		var r = new PlainOutput(t.state);
		t.write("Hello\ntest");
		expect(r.toString()).to.be('Hello\ntest\n\n\n');
	});
});
