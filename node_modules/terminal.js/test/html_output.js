describe("HtmlOutput", function() {
	var TermState = Terminal.TermState;
	var HtmlOutput = Terminal.output.HtmlOutput;

	function newTerminal(w, h) {
		var t = new TermState({rows:h, columns:w}), tw = new Terminal(t);
		t.setMode("crlf", true);
		return tw;
	}

	it("basic write test", function() {
		var t = newTerminal();
		var r = new HtmlOutput(t.state);
		t.write("\x1b[31mHello\x1b[m World");

		expect(r.toString()).to.contain("<span style='color:#cc0000;'>Hello</span>&nbsp;World</div>");
	});
});
