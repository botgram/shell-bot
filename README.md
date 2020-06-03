# gclone-shell-bot

<img src="https://raw.githubusercontent.com/cgkings/gclone_shell_bot/master/images/chat.jpg" height="680px" width="520px">

**注意:** 暂时不支持windows.

## 安装步骤：<hr />
<details>
<summary>步骤一：运行环境(Ubuntu/Debian)</summary>
1.确保自己安装了python3.6 +，依次运行以下命令，因为我也不知道shellbot到底需要哪些，所以把我装的全部告诉你，注意错误提示：<br>

```
pip3 install pipenv

pip3 install delegator.py

pip3 install python-telegram-bot

pip3 install pysocks

```

2.安装[node-pty依赖项](https://github.com/Microsoft/node-pty#dependencies).

```
sudo apt install -y make python build-essential
```

</details>
<details>
<summary>步骤二：克隆库</summary>

```
git clone https://github.com/botgram/shell-bot.git && cd shell-bot
npm install
```

</details>
<details>
<summary>步骤三：启动bot</summary>

```
node server
```

</details>
<details>
<summary>步骤四：配置bot</summary>

1.获取Telegram bot的token和用户id

* 使用Telegram的botfather建立一个属于你的bot，获取bot token

* 使用用户id获取bot，获取你自己的用户ID

复制以上信息备用

2.第一次运行它时，它将询问您一些问题并自动创建配置文件：config.json。您也可以手动编写，请参见config.example.json。<br>
启动后，它将在启动Bot ready.并运行时显示一条消息。为了方便起见，您可能需要与BotFather交谈并将命令列表设置为的内容commands.txt。

</details>
<details>
<summary>步骤五：安装魔改版gclone</summary>

[魔改版gclone](https://github.com/mawaya/rclone) 

这位大佬，是个有技术的懒人，小白的福音啊，用他的gclone可以简化sa切换日志内容，其他还有很多功能，自己去瞻仰下吧

当然如果你能忍受纷繁而无意义的sa切换日志，此步骤可以省略，如果过几天我对应性修改了懒人一键脚本的ID提取，那么这步就不能省略

</details>
<details>
<summary>步骤六：安装gclone懒人一键转存脚本</summary>

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/cgkings/gclone_shell_bot/master/installbot.sh)"
```

[脚本配置教程](https://github.com/cgkings/gclone-assistant) 

当你熟悉以后应该可以根据自己的需要修改脚本了，有问题TG找 onekingen，他在这个脚本的自定义道路上已经越走越（歪）远了，冉冉升起的小白大神

</details>
<details>
<summary>步骤七：配置bot</summary>

其实如果你能忍受，每次向bot输入/gd的话，这步可以省略<br>
如果你跟我一样懒，请往下看<br>
如果你比我还懒，别看教程了，打开代码，试着修改一下，你能实现更多你自己想要的功能，这里给大家介绍一位不愿透漏姓名的大神fxxkrlab的 [转存bot教材](https://github.com/fxxkrlab/iCopy) ，你研究透了，就该我膜拜你了 <br>
 ok,说了这么多，其实是因为这一步很短，google或者百度bot自定义命令或者自定义命令按钮，你就可以实现在bot上点"/"弹出/gd,点它启动一键转存脚本，或者是点一下bot按钮就启动，说的不具体是因为我也不太懂，非常期待你的bot按钮拉取消息

</details>

## 授权书<hr />
首次启动时，该漫游器将仅接受来自您的用户的消息。出于安全原因：您不希望任何人向您的计算机发出命令！<br>
如果要允许其他用户使用该漫游器，请使用/token并为其提供结果链接。如果您想在网上论坛上使用此漫游器，/token则会向您发送一条消息，转发到网上论坛<br> 

## 最后的话<hr />
送君千语，终有一别，作为一个小白，能堂而皇之的在github上恬不知耻的发布，是因为github开放的开发氛围，更是因为TG上面各位开放而热心的中国技术大佬的无私帮助，在此感谢各位TG大神，排名不分先后：<br>
* fxxkrlab （专业冒险者） 不厌其烦的希望我们能多学点语言，还根据我们的需要编写了 [转存bot教材](https://github.com/fxxkrlab/iCopy),可惜，暂时没研究出来<br>
* aevlp （steve x） 转存脚本的鼻祖，无私的提供了使用mysql实现转存任务序列的转存bot，可惜,暂时没研究出来<br>
* Ip2N5M （Kali Aska） 小白福音，不给教材，不给案例，直接给答案和工具，感谢他提供的脚本核心代码以及 [魔改版gclone](https://github.com/mawaya/rclone)，魔改了魔改rclone的gclone,体会一下 <br>
* shine_y （shine） 我修改的一键转存脚本的原作者，非常感谢，[地址](https://github.com/vcfe/gd) <br>
* onekingen (oneking) 脚本魔改路上的小伙伴，自定义脚本做了很多，[地址](https://github.com/vitaminx/gclone-assistant) <br>
* GreatPanoan （Panoan）带我走上买鸡不归路的领路人，没有他，不会开始这段折腾之旅，不管怎样，祝高考顺利，小子！<br>
另外，github上的 [hrvstr](https://github.com/) ,他提供了shellbot上自定义命令的范本，非常感谢他 <br>
当然，少不了shellbot的原作者 [Botgram](https://botgram.js.org)  <br>

最后，如果你是位外国友人，很荣幸，孙贼，用用google翻译吧！