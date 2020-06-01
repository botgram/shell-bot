# shell-bot

壳机器人
这是一个功能齐全的shellrunner Telegram机器人。您告诉它一个命令，它执行它并发布实时输出。您可以通过回复输出消息来将输入发送到命令。

这是一个相当复杂的示例，因为它实际上在命令中显示为终端，解释转义序列，并且如果触摸它们的行，它将更新消息。这意味着诸如wget之类的交互式程序应该自然运行，您应该看到状态栏更新。

该机器人还允许上传或下载文件，并且还具有一个简单的文本编辑器，以方便使用。

这是运行机器人git以克隆存储库的示例：

![Basic tasks](http://i.imgur.com/Xxtoe4G.png)

Here's an example of the bot running alsamixer:

**注意:** 暂时不支持windows.

## 安装步骤：

步骤一： install [node-pty dependencies](https://github.com/Microsoft/node-pty#dependencies). 
For example, if you're in Ubuntu/Debian:
~~~
sudo apt install -y make python build-essential
~~~

If you're using fedora instead:
```
sudo dnf install -y python
sudo dnf group install -y "C Development Tools and Libraries" 
```

Before using this, you should have obtained an auth token for your bot,
and know your personal user's numeric ID. If you don't know what this
means, check out the [blog post][] for a full step-by-step guide.

~~~
git clone https://github.com/botgram/shell-bot.git && cd shell-bot
npm install
~~~

To start the bot:

~~~
node server
~~~

The first time you run it, it will ask you some questions and create
the configuration file automatically: `config.json`. You can also
write it manually, see `config.example.json`.

When started it will print a `Bot ready.` message when it's up and running.
For convenience, you might want to talk to the BotFather and set the
command list to the contents of `commands.txt`.

## Authorization

When first started, the bot will just accept messages coming from your user.
This is for security reasons: you don't want arbitrary people to issue
commands to your computer!

If you want to allow another user to use the bot, use `/token` and give
that user the resulting link. If you want to use this bot on a group,
`/token` will give you a message to forward into the group.

## Proxy server

shell-bot obeys the `https_proxy` or `all_proxy` environment variable
to use a proxy, and supports HTTP/HTTPS/SOCKS4/SOCKS4A/SOCKS5 proxies.
Examples:

~~~ bash
export https_proxy="http://168.63.76.32:3128"
node server

export https_proxy="socks://127.0.0.1:9050"
node server
~~~

**Warning:** For SOCKS proxies, you need to use an IP address (not a DNS hostname).



[Telegram bot]: https://core.telegram.org/bots
[Botgram]: https://botgram.js.org
[blog post]: https://alba.sh/blog/telegram-shell-bot/
