# shell-bot

壳机器人
这是一个功能齐全的shellrunner Telegram机器人。您告诉它一个命令，它执行它并发布实时输出。您可以通过回复输出消息来将输入发送到命令。

这是一个相当复杂的示例，因为它实际上在命令中显示为终端，解释转义序列，并且如果触摸它们的行，它将更新消息。这意味着诸如wget之类的交互式程序应该自然运行，您应该看到状态栏更新。

该机器人还允许上传或下载文件，并且还具有一个简单的文本编辑器，以方便使用。

这是运行机器人git以克隆存储库的示例：

![Basic tasks](http://i.imgur.com/Xxtoe4G.png)

**注意:** 暂时不支持windows.

## 安装步骤：

步骤一：获取Telegram bot的token和用户id 
1.使用Telegram的botfather建立一个属于你的bot，获取bot token
2.使用用户id获取bot，获取你自己的用户ID
复制以上信息备用

步骤二：运行环境

install [node-pty dependencies](https://github.com/Microsoft/node-pty#dependencies). 
For example, if you're in Ubuntu/Debian:
~~~
sudo apt install -y make python build-essential
~~~

步骤三：克隆库

~~~
git clone https://github.com/botgram/shell-bot.git && cd shell-bot
npm install
~~~
步骤四：启动bot

~~~
node server
~~~

第一次运行它时，它将询问您一些问题并自动创建配置文件：config.json。您也可以手动编写，请参见config.example.json。

启动后，它将在启动Bot ready.并运行时显示一条消息。为了方便起见，您可能需要与BotFather交谈并将命令列表设置为的内容commands.txt。

## 授权书

首次启动时，该漫游器将仅接受来自您的用户的消息。出于安全原因：您不希望任何人向您的计算机发出命令！

如果要允许其他用户使用该漫游器，请使用/token并为其提供结果链接。如果您想在网上论坛上使用此漫游器，/token则会向您发送一条消息，转发到网上论坛 


[Telegram bot]: https://core.telegram.org/bots
[Botgram]: https://botgram.js.org
[blog post]: https://alba.sh/blog/telegram-shell-bot/
