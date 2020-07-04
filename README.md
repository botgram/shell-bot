# fclone-shell-bot

<img src="https://github.com/cgkings/gclone_shell_bot/blob/master/images/bot.gif" height="470px">

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
sudo apt install nodejs
sudo apt install -y make python build-essential
```

</details>
<details>
<summary>步骤二：克隆库</summary>

```
git clone https://github.com/cgkings/gclone_shell_bot.git && cd /root/gclone_shell_bot
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
<summary>步骤五：安装fclone</summary>

[fclone发布地址页](https://github.com/mawaya/rclone) <br>
一键安装命令：<br>
```
wget https://raw.githubusercontent.com/cgkings/fclone_shell_bot/master/fclone/fclone.zip && unzip fclone.zip && mv fclone /usr/bin && chmod +x /usr/bin/fclone && fclone version
```

作者是TG上的@fxxkrlab（F佬）和@Ip2N5M（K佬），都是很热心的人，小白的福音，欢迎大家去TG上骚扰他们，他们非常渴望你们的小白问题！

fclone的优势？其实没啥优势，就是比现存所有转存工具快个几十倍吧，速度见下图：

<img src="https://raw.githubusercontent.com/cgkings/fclone_shell_bot/master/images/spead.png"><br>

这张图是盗的TG上@asuka8，内测群里有名的快枪手！

<img src="https://github.com/cgkings/fclone_shell_bot/raw/master/images/speader.gif" width="800px" alt="速度图" ><br/>

这是我自己的速度图，512M VPS性能不给力

关于fclone,有啥问题除了问F佬和K佬，也可以加@asuka8和@waihoe89，他们都非常热心！

另外，隆重介绍一下TG上的@Komeanx（Jason Wu），头像经常换，名字还没换过，TG中文圈有名的小白奸商（现在已经不干了），热心的免费帮我搭建gclone，从此进入转存脚本的不归路（不准确，其实是从黄屁股卖给我野鸡大学教育子号开始的，其实根本不用买，美国社区大学能免费申请的一大堆）。。。<br>
</details>
<details>
<summary>步骤六：安装fclone一键转存脚本</summary>

```
低配（128 256 5000）

sh -c "$(curl -fsSL https://raw.githubusercontent.com/cgkings/fclone_shell_bot/master/script/fcloneinstall.sh)"

高配（256 400 10000）

sh -c "$(curl -fsSL https://raw.githubusercontent.com/cgkings/fclone_shell_bot/master/script/fclone_high/fcloneinstall.sh)"

```

[脚本配置教程](https://github.com/cgkings/gclone-assistant) 

当你熟悉以后应该可以根据自己的需要修改脚本了，有问题TG找 @onekings，他在这个脚本的自定义道路上已经越走越（歪）远了，冉冉升起的小白大神
你要是不在TG上找他问几个小白问题，就是不尊重他！

</details>
<details>
<summary>步骤七：使用转存bot</summary>

1、向bot输入/gd
  
  注：你也可以在TG找@BotFather，输入/setcommands，定义命令列表，这样你就可以在转存bot上点击“/”，选择“/gd”

2、在bot弹出信息“请输入你的分享链接”回复你要转存的分享链接

剩下的按图示操作就行，注意，所以需要输入的内容，必须在带“🔸”符号原信息回复方有效

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
