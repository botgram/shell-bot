# terminal.js: terminal emulator library for browsers and node.js

[![Build Status](https://travis-ci.org/Gottox/terminal.js.png)](https://travis-ci.org/Gottox/terminal.js)

Terminal.js is a rendering engine for vt100-like terminals.
It is written from scratch and supports most commonly used escape sequences.

## Example

a simple demo using the [colors](https://www.npmjs.com/package/colors) module:

```javascript
var colors = require('colors'),
	Terminal = require('./index');

var terminal = new Terminal({columns: 20, rows: 2});

terminal.write("Terminal.js in rainbows".rainbow);

console.log(terminal.toString('ansi'));
```

There's also a webterminal using terminal.js:
[node-webterm](https://github.com/Gottox/node-webterm)

## Documentation

The documentation is generated using [JSDoc](http://usejsdoc.org/) and can be
found [here](http://gottox.de/terminal.js)

## Source

Source is developed at [Github](http://github.com/Gottox/terminal.js)
