# fclone shell bot FAQ
**注意:** 暂时不支持windows.
<details>
<summary>1、使用rclone/gclone/fclone，区别？</summary>

均基于rclone，gclone增加了sa切换，fclone优化了多sa使用方式

速度上来说，rclone,gclone基本一致，fclone要快很多，具体快几倍还是几十倍还是几百倍，则受【sa的数量、阵列】【电脑&VPS性能】【flag设置】影响
</details>
<details>
<summary>2、fclone到底有多快？我的sa少，VPS差是不是就体验不到这种速度优势？</summary>

其实第一个问题已经说到了，rclone和gclone平均速度为1-2 files/s,而fclone最低4-5 files/s，保底快一倍！

至于说sa数量和vps性能，我不是google内部工作人员，没办法给你严谨的公式，只能枚举一些内测群朋友的情况：

| 序号 | sa数量 |vps cpu|vps内存|转存参数—checker|转存参数-transfer|转存目标情况      |     速度    |
| :--: |:-----:| :----:|:-----:|:-------------:|:--------------:|:---------------:|:-----------:|
| 01   | 200   | E5 1C | 512M  |      64       |       128      | 479T 10M以上文件 | 60  files/s |
| 02   | 400   | E3 1C | 512M  |      128      |       256      | 479T 10M以上文件 | 89  files/s |
| 03   | 2400  | R9 1C | 1G    |      256      |       250      | 479T 10M以上文件 | 180 files/s |
         
</details>
<details>
<summary>3、clone系列转存工具，设置自用client id的必要性？</summary>
>>这个问题其实挺麻烦                
>>使用自己的client id，低并发；
>>使用默认的rclone公用client id,高并发，但是N多人使用，也有可能会堵车；
>>官方解释是这样的——原文地址：https://rclone.org/drive/#making-your-own-client-id

</details>
<details>
<summary>4、神奇的fclone命令？</summary>

>>原文地址：https://rclone.org/drive/#making-your-own-client-id

</details>
<details>
<summary>5、fclone参数——速度篇</summary>
Rclone优化
有关优化的想法最终应记录在主要文档中。

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
有关优化的想法最终应记录在主要文档中。

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
<summary>7、比fclone更快？jclone发布前的准备工作</summary>

原文地址：https://rclone.org/drive/#making-your-own-client-id
</details>
