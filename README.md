# shell

This is a fully functional shellrunner bot. You tell it a command,
it executes it and posts the live output. You can send input to the
command by replying to the output messages.

It's a fairly complex example, because it actually appears to the
command as a terminal, interprets escape sequences and **it will
update messages if their lines get touched**. This means interactive
programs such as wget should work naturally, you should see the
status bar update.

## Usage

TODO
