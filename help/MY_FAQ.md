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

原文地址：https://rclone.org/drive/#making-your-own-client-id
</details>
<details>
<summary>4、预留</summary>

原文地址：https://rclone.org/drive/#making-your-own-client-id
</details>
