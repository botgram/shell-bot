### Classes

- `Termios` Class to hold termios struct data.

    #### Attributes
    
    - `c_iflag`: Integer representing the input mode flags.
    - `c_oflag`: Integer representing the output mode flags.
    - `c_cflag`: Integer representing the character mode flags.
    - `c_lflag`: Integer representing the local mode flags.
    - `c_cc`: Object representing the control character settings.

    #### Methods
    
    - `constructor(arg)`: Create new termios object.
      To prefill termios data set `arg` to
      a valid file descriptor or another Termios object.
    - `loadFrom(fd)`: Load termios data from file descriptor `fd`.
    - `writeTo(fd, action)`: Set termios data of file descriptor `fd`.
      `action` must be one of `termios.ACTION` (defaults to `TCSAFLUSH`).
    - `getInputSpeed()`: Returns input channel baud rate setting.
    - `getOutputSpeed()`: Returns output channel baud rate setting.
    - `setInputSpeed(speed)`: Sets input channel baud rate.
      `speed` must be one of the predefined baudrates in `termios.BAUD`.
    - `setOutputSpeed(speed)`: Sets output channel baud rate.
      `speed` must be one of the predefined baudrates in `termios.BAUD`.
    - `setSpeed(speed)`: Sets input and output channel baud rate.
      `speed` must be one of the predefined baudrates in `termios.BAUD`.
    - `setraw()`: Set termios data to raw mode (taken from Python).
    - `setcbreak()`: Set termios data to cbreak mode (taken from Python).
    - `toBuffer()`: Creates a node::Buffer representation of termios data.

### Termios.h symbols

The module exports known symbols defined by the
underlying termios.h (platform dependent) and low level functions under `.native`.

- `ALL_SYMBOLS`: All known symbols.
- `IFLAGS`: Input mode symbols.
- `OFLAGS`: Output mode symbols.
- `CFLAGS`: Character mode symbols.
- `LFLAGS`: Local mode symbols.
- `CC`: Valid symbols defined for control character settings.
- `ACTION`: Symbols defined for `tcsetattr`
  (when the changes should be applied).
- `FLUSH`: Symbols for `tcflush`.
- `FLOW`: Symbols for `tcflow`.
- `BAUD`: Defined baudrates of the platform.

### Low level functions

- `isatty(fd)`: Test if file descriptor `fd` is a tty.
- `ttyname(fd)`: Return tty file name for `fd`.
  Return empty string for an invalid file descriptor.
- `ptsname(fd)`: Return pts file name for file descriptor `fd`.
  This can only be used from the master end of a pty.
  For slave end use `ttyname`.
- `tcgetattr(fd, termios)`: Get termios data for file descriptor `fd`.
  `termios` must be a Termios object.
- `tcsetattr(fd, action, termios)`: Set termios data for file descriptor `fd`.
  `action` must be one of `termios.ACTION`. `termios` must be a Termios object.
- `tcsendbreak(fd, duration)`
- `tcdrain(fd)`
- `tcflush(fd, queue_selector)`
- `tcflow(fd, flowaction)`
- `cfgetispeed(termios)`
- `cfgetospeed(termios)`
- `cfsetispeed(termios, speed)`
- `cfsetospeed(termios, speed)`


### Example

The example demostrates how to switch off echoing on STDIN.
```javascript
var Termios = require('node-termios').Termios;
var sym = require('node-termios').native.ALL_SYMBOLS;

var tty = new Termios(0);
tty.c_lflag &= ~(sym.ECHO | sym.ECHONL);
tty.writeTo(0);
```

