# fclone shell bot FAQ
**注意:** 暂时不支持windows.
<details>
<summary>1、使用rclone/gclone/fclone，区别？</summary>

均基于rclone，gclone增加了sa切换，fclone优化了多sa使用方式

速度上来说，rclone,gclone基本一致，fclone要快很多，具体快几倍还是几十倍还是几百倍，则受【sa的数量、结构】【电脑&VPS性能】【flag设置】影响
</details>
<details>
<summary>2、fclone到底有多快？我的sa少，VPS差是不是就体验不到这种速度优势？</summary>

根据[rclone官方说明](https://rclone.org/drive/)，rclone和gclone平均速度为2 files/s,而fclone最低4-5 files/s，保底快一倍！

至于说sa数量和vps性能，我不是google内部工作人员，没办法给你严谨的公式，只能枚举一些内测群朋友的情况：

| 序号 | sa数量 |    sa结构      |vps cpu|vps内存|转存参数—checker|转存参数-transfer|转存目标情况      |     速度    |
| :--: |:-----:|:--------------:| :----:|:-----:|:-------------:|:--------------:|:---------------:|:-----------:|
| 01   | 400   | 100 sa/project | E3 1C | 512M  |      32       |       32       | 479T 10M以上文件 | 50  files/s |
| 02   | 2400  | 100 sa/project | R9 1C | 1G    |      128      |       128      | 479T 10M以上文件 | 98  files/s |
| 03   | 5000  | 20 sa/project  | R9 1C | 1G    |      256      |       256      | 479T 10M以上文件 | 160 files/s |
| 04   | 5000  | 10 sa/project  | R9 1C | 1G    |      320      |       326      | 479T 10M以上文件 | 200 files/s |
| 05   | 15000 | 100 sa/project |    2C | 4G    |      1000     |       2500     | 479T 10M以上文件 | 350 files/s |
| 05   | 20000 | 100 sa/project |    2C | 4G    |      3000     |       3000     | 479T 10M以上文件 | 600 files/s |

**注意：100sa/proj，sa和checker transfers的比例最大是10:1，稳定推荐复制数量大的文件是20:1，即如有2000sa，checker transfer不大于100！**
**pacerburst 5000**
**不听劝的后果是：拖慢速度|漏存文件|冗余文件**
**建议：sa结构 10 sa/project，sa数量：10000~15000**
         
</details>
<details>
<summary>3、clone系列转存工具，设置自用client id的必要性？</summary>
>这个问题其实挺麻烦                
>使用自己的client id，低并发；
>使用默认的rclone公用client id,高并发，但是N多人使用，也有可能会堵车；
>官方解释是这样的——原文地址：https://rclone.org/drive/#making-your-own-client-id
```
--drive-client-id
建议您设置自己的Google Application Client ID。有关如何创建自己的示例，请参见https://rclone.org/drive/#making-your-own-client-id。
**如果将此空白留空，它将使用性能低下的内部密钥**
```
根据rclone官方说法，还是建议用自己的，都用它那个公共的，它也顶不住！

</details>
<details>
<summary>4、神奇的fclone命令？</summary>

* `rclone version`    - 显示版本号
* `rclone listremotes`- 列出配置文件中的所有的remote用户名
* `rclone tree`       - [文件树形式列出遥控器的内容](https://rclone.org/commands/rclone_tree/)
* `rclone ls`         - [用大小和路径列出路径中的对象](https://rclone.org/commands/rclone_ls/)
* `rclone lsd`        - [列出路径中的所有目录](https://rclone.org/commands/rclone_lsd/)
* `rclone lsf`        - [列出remote：path中用于解析的目录和对象](https://rclone.org/commands/rclone_lsf/)
* `rclone lsjson`     - [以JSON格式列出路径中的目录和对象](https://rclone.org/commands/rclone_lsjson/)

* `rclone move`       - [将文件从源移动到目标](https://rclone.org/commands/rclone_move/)
* `rclone copy`       - [将文件从源复制到dest，跳过已复制的文件](https://rclone.org/commands/rclone_copy/)
* `rclone sync`       - [使源和目标相同，仅修改目标](https://rclone.org/commands/rclone_sync/)

* `rclone size`       - [打印remote：path中对象的总大小和数量](https://rclone.org/commands/rclone_size/)
* `rclone check`      - [检查源和目标中的文件是否匹配](https://rclone.org/commands/rclone_check/)
* `rclone dedupe`     - [交互式查找重复文件并删除/重命名它们](https://rclone.org/commands/rclone_dedupe/)


* `rclone delete`     - [删除路径的内容](https://rclone.org/commands/rclone_delete/)
* `rclone rmdirs`     - [删除路径下的空目录](https://rclone.org/commands/rclone_rmdirs/)

* `rclone mount`      - [在挂载点上将远程作为文件系统挂载](https://rclone.org/commands/rclone_mount/)

</details>
<details>
<summary>5、fclone参数——速度篇</summary>
```
--drive-server-side-across-configs --stats=1s --stats-one-line -P --ignore-checksum  --checkers=1800 --transfers=1800 --drive-pacer-min-sleep=1ms --drive-pacer-burst=3000 --check-first --log-level=DEBUG --log-file=/root/fclone_debug.log
```

* `--drive-server-side-across-configs` 允许服务器端操作（例如，复制）跨不同的驱动器配置工作。请注意，默认情况下未启用此功能。

* `--drive-pacer-min-sleep=1ms`        API调用之间的最短睡眠时间

* `--drive-pacer-burst=xxx`            允许不休眠的API调用数,注意不能全开，否则循环erro,建议开启数量=sa*25%

* `--checkers=1800 --transfers=1800`   fclone的变速箱，check和transfer的线程，推荐线程数=sa数/20（前提vps性能撑得住）

* `--check-first`                      fclone快的根本，默认no check first，没有这个标签，fclone=gclone=rclone

* `--disable ListR`                    关闭默认的fast list,规避listr的bug提示，整个世界清净了

* `--ignore-checksum`                  

何时使用/不使用--no-traverse：
假设您的目的地有6个文件{a，b，c，d，e，f}。

如果将{a}复制到目的地，则没有遍历，rclone将在所有文件{a，b，c，d，e，f}的定义中加载，然后发现是否需要上传{a}。如果您使用--no-traverse，则rclone只会在遥控器上检查{a}。

那么，为什么不一直使用--no-traverse？

如果要将{a，b，c，d，e，f}复制到目标位置，则rclone将单独检查每个文件。这将至少需要6笔交易，而您可能已经在1个清单中完成了所有对象的清单。

因此需要权衡！在1.36版中实现的新同步方法使--no-traverse的使用性比以前降低了，但是它仍然派上用场，尤其是在将文件移动或复制到更深的层次结构中时。

如何在微型实例上运行
内存不足一千兆字节的微型实例上的RClone可能会崩溃。您可以执行以下操作：

键入export GOGC=20运行rclone之前。
去掉 --fast-list
降低 --transfers=

</details>
<details>
<summary>6、fclone参数——功能篇</summary>

Rclone优化

</details>
<details>
<summary>7、处理【debian/ubuntu】python3版本问题</summary>
一行一行复制不管你之前什么版本

1.升级以及安装
```
apt update -y 
apt upgrade -y 
apt install python3 python3-pip --upgrade 
pip3 install --upgrade pip 
```
2.查看版本 
```
python3 --version 
pip3 --version 
```
如果发现python3 不是刚才提示你安装成功的版本
可能是你系统中存在旧的python3
执行以下命令 确认存在的python3版本

例如3.7.7 你就当他是3.7 第二个小数点后无视

`whereis python3`  

3.启用python版本
```
rm -rf /usr/bin/python3 
ln -s `which python3.x` /usr/bin/python3 
```
上面3.x的x
就是在第二步最后让你确定的版本号只保留1位小数

重新查看python3 版本号

`python3 --version`

</details>
<details>
<summary>8、处理 too many open files问题</summary>
         
####step 1)

`nano /etc/sysctl.conf`

添加以下行

`fs.file-max = 6553500`

保存退出执行以下命令

`sysctl -p`

####step 2)

`nano /etc/security/limits.conf`

添加以下行

```
* soft memlock unlimited
* hard memlock unlimited
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535

root soft memlock unlimited
root hard memlock unlimited
root soft nofile 65535
root hard nofile 65535
root soft nproc 65535
root hard nproc 65535
```
保存退出

step 3)

`nano /etc/pam.d/common-session`

添加以下行

`session required pam_limits.so`

保存退出，最后重启系统登录查看

`ulimit -a`

</details>
