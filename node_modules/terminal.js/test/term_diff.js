describe('TermDiff', function() {
	var TermState = Terminal.TermState;
	var TermDiff = Terminal.TermDiff;
	function newTermState(w, h) {
		var t = new TermState({rows:h, columns:w});
		t.setMode('crlf', true);
		return t;
	}

	it("creates TermDiff", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		var d = new TermDiff(t1, t2);
		expect(d.toJSON().changes.length).to.be(0);
	});

	it("diffs two terminals", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t1.write("_FFFFFF".replace(/(.)/g,'$1\n'));
		t2.write("_ADDE".replace(/(.)/g,'$1\n'));
		var d = new TermDiff(t1, t2);
		expect(d.toJSON().changes.length).to.be(4);
	});

	it("detects led changes", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t2.setLed(3,true);
		var d = new TermDiff(t1, t2);
		expect(d._leds).to.only.have.keys('3');
		expect(d._leds[3]).to.be(true);
	});

	it("detect mode changes", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t2.setMode('graphic',true);
		var d = new TermDiff(t1, t2);
		expect(d._modes).to.only.have.keys('graphic');
		expect(d._modes.graphic).to.be(true);
	});

	it("detects no cursor changes if the terminals are the same", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		var d = new TermDiff(t1, t2);
		expect(d._cursor).to.be(null);
		expect(d._savedCursor).to.be(null);
	});

	it("detects cursor changes if the terminals are different", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t1.write('a');
		t1.write('\n');
		t1.write('a');
		var d = new TermDiff(t1, t2);
		expect(d._cursor).to.only.have.keys('x','y');
		expect(d._savedCursor).to.be(null);
	});

	it("detects saved cursor changes if the terminals are different", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t2.write('a');
		t2.write('\n');
		t2.write('a');
		t2.saveCursor();
		var d = new TermDiff(t1, t2);
		expect(d._cursor).to.only.have.keys('x','y');
		expect(d._savedCursor).to.only.have.keys('x','y');
	});

	it("detects line changes in second buffer", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t1.write('lalal');
		var d = new TermDiff(t1, t2);
		expect(d.toJSON().changes.length).to.be(1);
		expect(d.toJSON().changes[0]['.'].str).to.be('');
	});

	it("detects line changes in first buffer", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t2.write('lalal');
		var d = new TermDiff(t1, t2);
		expect(d.toJSON().changes[0]['.'].str).to.be('lalal');
		expect(d.toJSON().changes.length).to.be(1);
	});

	it("detects line removed in the second buffer", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t1.write('lalal\n');
		t2.write('lalal');
		var d = new TermDiff(t1, t2);
		expect(d.toJSON().changes[0]['-']).to.be(1); // Remove of line
		expect(d.toJSON().changes.length).to.be(1);
	});

	it("detects line added in the second buffer", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		t1.write('lalal');
		t2.write('lalal\n');
		var d = new TermDiff(t1, t2);
		expect(d.toJSON().changes[0]['+'].str).to.be(''); // Remove of line
		expect(d.toJSON().changes.length).to.be(1);
	});

	it("detects no size differences if the terminals are the same", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		var d = new TermDiff(t1, t2);
		expect(d._columns).to.be(null);
		expect(d._rows).to.be(null);
	});

	it("detects size differences if the terminals are different", function() {
		var t1 = newTermState(10,20);
		var t2 = newTermState(12,30);
		var d = new TermDiff(t1, t2);
		expect(d._columns).to.be(12);
		expect(d._rows).to.be(30);
	});

	/*it("detects no tabs differences if the terminals are the same", function() {
		var t1 = newTermState();
		var t2 = newTermState();
		var d = new TermDiff(t1, t2);
		expect(d._tabs).to.be.empty();
	});*/

	it("detects tabs differences if the terminals are different", function() {
		var t1 = newTermState(10,20);
		var t2 = newTermState(12,30);
		t1.write("a");
		t1.setTab();
		var d = new TermDiff(t1, t2);
		expect(d._tabs).to.be.a(Array);
	});

	it("correctly applies size", function() {
		var t1 = newTermState(80,24);
		var d = { rows: 30, columns:12 };
		var p = new TermDiff(d);
		p.apply(t1);
		expect(t1.rows).to.be(30);
		expect(t1.columns).to.be(12);
	});

	it("correctly applies cursor", function() {
		var t1 = newTermState(80,24);
		var d = { cursor: { 'x': 10, 'y':12 } };
		var p = new TermDiff(d);
		p.apply(t1);
		expect(t1.cursor.x).to.be(10);
		expect(t1.cursor.y).to.be(12);
	});

	it("correctly applies savedCursor", function() {
		var t1 = newTermState(80,24);
		var d = { savedCursor: { 'x': 10, 'y':12 } };
		var p = new TermDiff(d);
		p.apply(t1);
		expect(t1._savedCursor.x).to.be(10);
		expect(t1._savedCursor.y).to.be(12);
	});

	it("correctly applies scrollRegion", function() {
		var t1 = newTermState(80,24);
		var d = { scrollRegion: [ 0, 12 ] };
		var p = new TermDiff(d);
		p.apply(t1);
		expect(t1._scrollRegion[0]).to.be(0);
		expect(t1._scrollRegion[1]).to.be(12);
	});

	it("correctly applies leds", function() {
		var t1 = newTermState(80,24);
		var d = { leds: { 0: true } };
		var p = new TermDiff(d);
		p.apply(t1);
		expect(t1._leds[0]).to.be(true);
		expect(t1._leds[1]).to.be(false);
	});

	it("correctly applies tabs", function() {
		var t1 = newTermState(80,24);
		var d = { tabs: [1] };
		var p = new TermDiff(d);
		p.apply(t1);
		expect(t1.tabs.length).to.be(1);
		expect(t1.tabs[0]).to.be(1);
	});

	it("correctly applies mode changes", function() {
		var t1 = newTermState();
		var gmode1 = t1._modes.graphic;
		expect(gmode1).to.be(false);
		var d = { modes: { 'graphic': true } };
		var p = new TermDiff(d);
		p.apply(t1);
		var gmode2 = t1._modes.graphic;
		expect(gmode2).to.be(true);
	});

	it("correctly applies remove Line", function() {
		var t1 = newTermState(80,24);
		t1.write('line'); t1.write('\n');
		t1.write('line'); t1.write('\n');
		t1.write('line'); t1.write('\n');
		t1.write('line');
		var d = { changes: [ { 'l': 0 , '-': 3 }] };
		var p = new TermDiff(d);
		p.apply(t1);
		expect(t1.getBufferRowCount()).to.be(1);
	});
});
