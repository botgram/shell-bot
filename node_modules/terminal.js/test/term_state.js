describe('TermState', function() {
	var TermState = Terminal.TermState;

	function newTermState(w, h) {
		var t = new TermState({rows:h, columns:w});
		t.setMode('crlf', true);
		return t;
	}

	it("creates TermState", function() {
		expect(newTermState()).to.have.property('write');
		expect(newTermState().toString()).to.be("");
	});
	it("creates TermState with dimension", function() {
		var t = newTermState(100, 200);
		expect(t.columns).to.be(100);
		expect(t.rows).to.be(200);
	});
	it("writes to TermState", function() {
		var t = newTermState();
		t.write("Hello World");
		expect(t.toString()).to.be("Hello World");
		t.write("\nHello World");
		expect(t.toString()).to.be("Hello World\nHello World");
		t.write("\n");
		expect(t.toString()).to.be("Hello World\nHello World\n");
	});
	it("sets cursor", function() {
		var t = newTermState(10, 10);
		t.write("1234567890");
		expect(t.cursor.x).to.be(10);
		expect(t.cursor.y).to.be(0);
	});
	it("breaks lines", function() {
		var t = newTermState(10, 10);
		t.write("1234567890abcdefghi");
		expect(t.toString()).to.be("1234567890\nabcdefghi");
		t.write("j");
		expect(t.toString()).to.be("1234567890\nabcdefghij");
	});
	it("scrolls", function() {
		var t = newTermState(10, 10);
		t.write("1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20");
		expect(t.toString()).to.be("11\n12\n13\n14\n15\n16\n17\n18\n19\n20");
	});
	it("scrolls manually", function() {
		var t = newTermState(10, 10);
		t.write("1\n2\n3\n4\n5\n6\n7\n8\n9\n10");
		t.scroll(5);
		expect(t.toString()).to.be("6\n7\n8\n9\n10\n\n\n\n\n");
		t.reset();
		t.setMode("crlf", true);
		t.write("1\n2\n3\n4\n5\n6\n7\n8\n9\n10");
		t.scroll(-5);
		expect(t.toString()).to.be("\n\n\n\n\n1\n2\n3\n4\n5");
	});
	it("moves cursor up", function() {
		var t = newTermState();
		t.write("Test\nTest");
		t.mvCursor(0, -1);
		t.write("!");
		expect(t.toString()).to.be("Test!\nTest");

		t = newTermState();
		t.write("Test\nTest");
		t.mvCursor(0, -2);
		t.write("!");
		expect(t.toString()).to.be("Test!\nTest");
	});
	it("moves cursor down", function() {
		var t = newTermState();
		t.write("Test\nTest");
		t.mvCursor(0,1);
		t.write("!");
		expect(t.toString()).to.be("Test\nTest\n    !");
	});
	it("moves cursor left", function() {
		var t = newTermState();
		t.write("Tesd");
		t.mvCursor(-1,0);
		t.write("t");

		expect(t.toString()).to.be("Test");
		t.mvCursor(-100,0);
		t.write("Hello World");
		expect(t.toString()).to.be("Hello World");
	});
	it("moves cursor right", function() {
		var t = newTermState();
		t.write("Tes");
		t.mvCursor(1,0);
		t.write("t");
		expect(t.toString()).to.be("Tes t");
	});
	it("deletes lines", function() {
		var t = newTermState();
		t.write("1\n2\n3\n4");
		t.setCursor(null, 1);
		t.removeLine(2);
		expect(t.toString()).to.be("1\n4");
	});
	it("inserts lines", function() {
		var t = newTermState();
		t.write("1\n2\n3\n4");
		t.setCursor(0, 1);
		t.insertLine(2);
		t.write("a\nb");
		expect(t.toString()).to.be("1\na\nb\n2\n3\n4");
	});
	it("inserts out of scope of buffer", function() {
		var t = newTermState();
		t.setCursor(4,4);
		t.write("AA");
		expect(t.toString()).to.be("\n\n\n\n    AA");
	});
	it("should overwrite the previous line when moving the cursor up", function() {
		var t = newTermState();
		t.write("ABCDEF\n");
		t.mvCursor(0,-1);
		t.write("GHIJKL");

		expect(t.toString()).to.be("GHIJKL\n");
	});
	it("works in insertmode", function() {
		var t = newTermState();
		t.setMode('insert', true);
		t.write("__");
		t.setCursor(1, 0);
		t.write("AAAA");

		expect(t.toString()).to.be("_AAAA_");
	});
	it("works in insertmode with linebreaks", function() {
		var t = newTermState(10,10);
		t.setMode('insert', true);
		t.write("__");
		t.setCursor(1, 0);
		t.write("1234567890");

		expect(t.toString()).to.be("_123456789\n0");
	});

	it("should move Left", function() {
		var t = newTermState();
		t.write("ABCDEF");
		t.mvCursor(-1, 0);
		t.write("AA");
		expect(t.toString()).to.be("ABCDEAA");
	});
	it("resize correctly to smaller size, cut off right", function() {
		var t = newTermState(80,24);
		t.setCursor(0,23);
		t.write("line1");
		t.resize({rows: 2, columns: 2 });
		t.mvCursor(-10,0);
		t.write("\nab");
		expect(t.toString()).to.be("li\nab");
	});

	it("resize correctly to smaller size, cut off top", function() {
		var t = newTermState(80,24);
		t.write("line1\n");
		t.resize({rows: 2, columns: 2 });
		t.write("ab\n");
		expect(t.toString()).to.be("ab\n");
	});
	it("resize correctly to bigger size", function() {
		var t = newTermState(80,24);
		t.write("line1\n");
		t.resize({rows: 28, columns: 80 });
		expect(t.toString()).to.be("line1\n");
	});
	it("emits a linechange event", function(done) {
		var t = newTermState();
		t.write("hello");
		t.once('linechange', function(nbr, str, attr) {
			done();
		});
		t.write("world");
	});
	it("works with wrap = false", function() {
		var t = newTermState(10,24);
		t.setMode('wrap', false);
		t.write("1234567890a");
		expect(t.toString()).to.be("123456789a");
		t.write("b");
		expect(t.toString()).to.be("123456789b");
	});
	it("works wrap = false and with lineFeed", function() {
		var t = newTermState(10,24);
		t.setMode('wrap', false);
		t.write("abc\n1234567890a");
		expect(t.toString()).to.be("abc\n123456789a");
		t.write("b");
		expect(t.toString()).to.be("abc\n123456789b");
	});
	it("emits cursor move", function(done) {
		var t = newTermState();
		t.write("Hello World\nHow are you?");
		t.on("cursormove", function(x, y) {
			expect(x).to.be(12);
			expect(y).to.be(1);
			done();
		});
	});
	it("emits line insert events on write", function(done) {
		var t = newTermState();
		var i = 0;
		t.on('lineinsert', function(number, line) {
			expect(number).to.be(i);
			if(++i === 2)
				done();
		});
		t.write("test\nbar");
	});
	it("emits line remove events on write", function(done) {
		var t = newTermState(80, 10);
		t.on('lineremove', function(number, line) {
			expect(number).to.be(0);
			done();
		});
		t.write("1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11");
	});
	it("erases below", function() {
		var t = newTermState(10, 10);
		t.write("1Line1234567890\n2\n3\n4\n5\n6\n7\n8\n9");
		t.setCursor(1,0);
		t.eraseInDisplay('below');
		expect(t.toString()).to.be("1\n\n\n\n\n\n\n\n\n");
	});
	it("erases above", function() {
		var t = newTermState(10, 10);
		t.write("1Line1234567890\n2\n3\n4\n5\n6\n7000\n8\n9");
		t.setCursor(3,7);
		t.eraseInDisplay('above');
		expect(t.toString()).to.be("\n\n\n\n\n\n6\n   0\n8\n9");
	});
	it("keeps correct size", function() {
		var t = newTermState(80,24);
		t.setCursor(0,23).write("line1\nline2");
		expect(t.getBufferRowCount()).to.be(24);
	});
	it("keeps correct attributes", function() {
		var t = newTermState(80,24);
		t.setAttribute("bold", true);
		t.write("Hello\nWorld");
		t.setAttribute("bold", false);
		t.insertLine(1); // Insert one line between Hello and World
		t.setCursor(0, 1);
		t.write("TEST");
		expect(t.getLine(2).attr[0].bold).to.be(true);
	});

	it("should keep attributes on reset", function() {
		var t = newTermState(80,24);
		t.setAttribute('bold', true);
		t.setAttribute('inverse', true);
		t.write("Bold+Inverse");
		t.resetAttribute();
		expect(t.getLine(0).attr[0].bold).to.be(true);
		expect(t.getLine(0).attr[0].inverse).to.be(true);
	});

	it("should not overwrite attributes", function() {
		var t = newTermState(80,24);
		t.setAttribute('bold', true);
		t.write("ABCDEFGH");
		t.resetAttribute();
		t.setCursor(1, 0);
		t.write("b");
		t.setCursor(3, 0);
		t.write("d");
		t.setCursor(5, 0);
		t.write("f");
		var a = t.getLine(0).attr;
		expect(a[0].bold).to.be(true);  // A
		expect(a[1].bold).to.be(false); // b
		expect(a[2].bold).to.be(true);  // C
		expect(a[3].bold).to.be(false); // d
		expect(a[4].bold).to.be(true);  // E
		expect(a[5].bold).to.be(false); // f
		expect(a[6].bold).to.be(true);  // G
		expect(a[7]).to.be(undefined);  // H
	});

	it("should remove characters correctly", function() {
		var t = newTermState(80,24);
		t.write("ABCDEFGHI");
		t.setCursor(0,0);
		t.removeChar(3);
		expect(t._buffer.str[0]).to.be("DEFGHI");
		expect(t._buffer.attr[0]["DEFGHI".length]).to.be.a("object");
	});

	it("should print normal characters when theres no graphical representation", function() {
		var t = newTermState(80,24);
		t.setMode('graphic', true);
		t.write(" lqwqk");
		expect(t._buffer.str[0].length).to.be(" lqwqk".length);
	});

	it("can't set beyond 4 leds", function() {
		var t = newTermState();
		t.setLed(4,true);
		expect(t._leds.length).to.be(4);
	});

	it("inserts whitespaces", function() {
		var t = newTermState();
		t.write("abc");
		t.setAttribute('bold', true);
		t.write("def");
		t.setCursor(1,0);
		t.insertBlank(2)
		expect(t._buffer.str[0]).to.be("a  bcdef");
		expect(t._buffer.attr[0][0].bold).to.be(false)
		expect(t._buffer.attr[0][5].bold).to.be(true)
	});
});
