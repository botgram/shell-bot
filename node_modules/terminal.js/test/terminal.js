describe('Terminal', function() {
	function newTerminal(w, h) {
		var t = new Terminal({columns: w, rows: h});
		t.state.setMode('crlf', true);
		return t;
	}
	it("can handle splitted escape sequences", function() {
		var t = newTerminal();
		t.write("\x1b");
		t.write("[");
		t.write("10");
		t.write(";");
		t.write("2");
		t.write("0");
		t.write("H");
		expect(t.state.cursor.x).to.be(19);
		expect(t.state.cursor.y).to.be(9);
	});
	it("should handle mode changes correctly", function() {
		var t = newTerminal();
		t.write("\x1b[?999h");
		t.write("\x1b[?47h");
		t.write("\x1b[?1047h");
		t.write("\x1b[?1048h");
		t.write("\x1b[?1049h");
		t.write("\x1b[?1046h");
		expect(t.toString()).to.be("");
	});
	it("shouldn't print non printables", function() {
		var t = newTerminal();
		t.write("\x0e\x0f");
		expect(t.toString()).to.be("");
	});
	it("should clear", function() {
		var t = newTerminal(80,10);
		t.write("ABCDEF\n\nFOO\n\x1b[H\x1b[2J");
		expect(t.toString()).to.be("\n\n\n\n\n\n\n\n\n");
	});
	it("moves down and to beginning of line (NEL)", function() {
		var t = newTerminal();
		t.write("aaa\x1bEbbb");
		expect(t.toString()).to.be("aaa\nbbb");
	});
	it("moves down and at current position (IND)", function() {
		var t = newTerminal();
		t.write("aaa\x1bDbbb");
		expect(t.toString()).to.be("aaa\n   bbb");
	});
	it("should save and restore the cursor correctly (DECSC) and (DESCR)", function() {
		var t = newTerminal(80,24);
		t.write("\x1b7ABCDE\x1b8FGH");
		expect(t.toString()).to.be("FGHDE");
	});
	/* Failing test
	it("should keep attributes on pageup and newline", function() {
		var t = newTerminal(80,24);
		t.write("\x1b[0;1mBold\x1b[0m\n\x1b[A\n");
		expect(t.toString()).to.be("Bold\n");
		expect(t.state.getLine(0).attr['0'].bold).to.be(true);
	}); */
	it("should reverse the terminal correctly", function() {
		var t = newTerminal(80,24);
		expect(t.state._modes.reverse).to.be(false);
		t.write("\x1b[?5hABCDEFGH");
		expect(t.state._modes.reverse).to.be(true);
		t.write("\x1b[?5l");
		expect(t.state._modes.reverse).to.be(false);
		expect(t.toString()).to.be("ABCDEFGH");
	});

	it("should set Leds", function() {
		var t1 = newTerminal();
		expect(t1.state.getLed(0)).to.be(false);
		expect(t1.state.getLed(1)).to.be(false);
		expect(t1.state.getLed(2)).to.be(false);
		expect(t1.state.getLed(3)).to.be(false);
		// enable every single Led and one not existing
		for(var i = 0; i < 5; i++) {
			t1.write("\x1b["+(i+1)+"q");
			expect(t1.state.getLed(0)).to.be(i==0);
			expect(t1.state.getLed(1)).to.be(i==1);
			expect(t1.state.getLed(2)).to.be(i==2);
			expect(t1.state.getLed(3)).to.be(i==3);
			expect(t1.state.getLed(4)).to.be(undefined);

			t1.write("\x1b[0q");

			expect(t1.state.getLed(0)).to.be(false);
			expect(t1.state.getLed(1)).to.be(false);
			expect(t1.state.getLed(2)).to.be(false);
			expect(t1.state.getLed(3)).to.be(false);
		}
		t1.write("\x1b[1q\x1b[2q\x1b[3q\x1b[4q");
		expect(t1.state.getLed(0)).to.be(true);
		expect(t1.state.getLed(1)).to.be(true);
		expect(t1.state.getLed(2)).to.be(true);
		expect(t1.state.getLed(3)).to.be(true);

		t1.write("\x1b[0q");

		expect(t1.state.getLed(0)).to.be(false);
		expect(t1.state.getLed(1)).to.be(false);
		expect(t1.state.getLed(2)).to.be(false);
		expect(t1.state.getLed(3)).to.be(false);
	});

	it("should reset (RIS)", function() {
		var t = newTerminal();
		//change mode, led and write a char
		t.write("\x1b[?5h\x1b[1qABCD\x1bc");
		expect(t.toString()).to.be("");
		expect(t.state._leds[0]).to.be(false);
		expect(t.state._leds[1]).to.be(false);
		expect(t.state._leds[2]).to.be(false);
		expect(t.state._leds[3]).to.be(false);
		expect(t.state._attributes.bold).to.be(false);
	});

	it("moves down and to beginning of line (NEL)", function() {
		var t = newTerminal();
		t.write("aaa\x1bEbbb");
		expect(t.toString()).to.be("aaa\nbbb");
	});
	it("moves down and at current position (IND)", function() {
		var t = newTerminal();
		t.write("aaa\x1bDbbb");
		expect(t.toString()).to.be("aaa\n   bbb");
	});
	it("should save and restore the cursor correctly (DECSC) and (DESCR)", function() {
		var t = newTerminal(80,24);
		t.write("\x1b7ABCDE\x1b8FGH");
		expect(t.toString()).to.be("FGHDE");
	});
	it("rings bell", function(done) {
		var t = newTerminal();
		t.on('bell', function() {
			done();
		});
		t.write("\x07");
		expect(t.toString()).to.be("");
	});
	it("should set ScrollRegion correctly if no params specified", function() {
		var t = newTerminal(80,13);
		t.write("ABCDEF\n\x1b[1;r");
		expect(t.state._scrollRegion[1]).to.be(12);
	});
	it("should set ScrollRegion correctly if params specified", function() {
		var t = newTerminal(80,24);
		t.write("ABCDEF\n\x1b[1;20r");
		expect(t.state._scrollRegion[0]).to.be(0);
		expect(t.state._scrollRegion[1]).to.be(19);
	});
	it("should scroll correctly when scrollregion is set", function() {
		var t = newTerminal(80,24);
		t.write("line1\nline2\nline3\nline4\n\x1b[4;5r");
		t.write("\n\n\n\n\n\n");
		expect(t.state.toString()).to.be('line1\nline2\nline3\n\n');
	});
	it("keeps correct size", function() {
		var t = newTerminal(80,24);
		t.write("\x1b[24;1Hline1\nline2");
		expect(t.state.getBufferRowCount()).to.be(24);
	});

	it("enters graphicsmode", function() {
		var t = newTerminal(10,10);
		t.write('\x1b(0');
		expect(t.state.getMode('graphic')).to.be(true);
	});

	it("leaves graphicsmode", function() {
		var t = newTerminal(10,10);
		t.write('\x1b(0a\x1b(B');
		expect(t.state.getMode('graphic')).to.be(false);
	});

	it("should convert chars graphicsmode", function() {
		var t = newTerminal(10,10);
		t.write('\x1b(0a\x1b(Ba');
		expect(t.state.getMode('graphic')).to.be(false);
		expect(t.state.toString()).to.be('▒a');
	});

	it("emits ready after write", function(done) {
		var t = newTerminal(80,24);
		t.once('ready', function() {
			done();
		});
		t.write("foo");
	});

	it("emits finish after end()", function(done) {
		var t = newTerminal(80,24);
		t.once('finish', function() {
			done();
		});
		t.write("foo");
		t.end();
	});

	it("should handle all escapes with defaults without barfing", function() {
		for (var i=0;i<2048;i++) {
		var t = newTerminal(80,24);
			t.write("\x1b"+String.fromCharCode(i));
		}
	});

	it("should handle all escapes with extra params without barfing", function() {
		for (var i=0;i<2048;i++) {
		var t = newTerminal(80,24);
			t.write("\x1b0;2"+String.fromCharCode(i));
		}
	});

	it("should handle all csi with defaults without barfing", function() {
		for (var i=0;i<2048;i++) {
		var t = newTerminal(80,24);
			t.write("\x1b["+String.fromCharCode(i));
		}
	});

	it("should handle all csi with extra params without barfing", function() {
		for (var i=0;i<2048;i++) {
		var t = newTerminal(80,24);
			t.write("\x1b[0;3"+String.fromCharCode(i));
		}
	});

	it("should scroll on reverse index", function() {
		var t = newTerminal(80,4);
		t.write("A\nB\nC\nD\x1b[H\x1bM");
		expect(t.state.toString()).to.be("\nA\nB\nC");
	});

	it("handles \\r correctly with terminal bounds", function() {
		var t = newTerminal(6, 4);
		t.write("1234");
		t.write("\rabcd\rABCD");
		expect(t.toString()).to.be("ABCD");
		t.state.setAttribute('bold', true);
		t.write("\rbb");
		expect(t.toString()).to.be("bbCD");
		var a = t.state.getLine(0).attr;
		expect(a[0].bold).to.be(true);  // bb
		expect(a[2].bold).to.be(false);  // CB
	});

	it("handles carriage returns", function() {
		var t = newTerminal(10, 10);
		t.write("1234\r56\r789");
		expect(t.toString()).to.be("7894");
	});

	it("handles OSC sequences (https://github.com/Gottox/terminal.js/issues/104)", function() {
		var t = newTerminal();
		t.write('\u001b]0;foo\u0007bar');
		expect(t.toString()).to.be("bar");
	});
	it("handles chunked OSC sequences (https://github.com/Gottox/terminal.js/issues/104)", function() {
		var t = newTerminal();
		t.write('\u001b]0;');
		t.write('foo\u0007bar');
		expect(t.toString()).to.be("bar");
	});

	it("handles garbaged OSC", function() {
		var t = newTerminal();
		t.write('\u001b]0;');
		t.write('foo\u0007bar');
		expect(t.toString()).to.be("bar");
	});
});

