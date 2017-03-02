# shell

This is a fully functional shellrunner bot. You tell it a command,
it executes it and posts the live output. You can send input to the
command by replying to the output messages.

It's a fairly complex example, because it actually appears to the
command as a terminal, interprets escape sequences and **it will
update messages if their lines get touched**. This means interactive
programs such as wget should work naturally, you should see the
status bar update.

Here's an example of the bot running alsamixer:

![Alsamixer with keypad](http://i.imgur.com/j8aXFLd.png)

This example demonstrates a great part of botgram's API.

## Install

Before using this, you should have obtained an auth token for your bot,
and know your personal user's numeric ID.

~~~
git clone https://github.com/jmendeth/node-botgram.git && cd node-botgram
npm install
cd examples/shell
npm install
~~~

To start the bot:

~~~
node server <auth token> <your ID>
~~~

If you receive a `Bot ready.` message, it's up and running.
For convenience, you might want to talk to the BotFather and set the
command list to the contents of `commands.txt`.

## Authorization

When first started, the bot will just accept messages coming from your user.
This is for security reasons: you don't want arbitrary people to issue
commands to your computer!

If you want to allow another user to use the bot, use `/token` and give
that user the resulting link. If you want to use this bot on a group,
`/token` will give you a message to forward into the group.
