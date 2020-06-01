#!/bin/bash
rm -rf gdbot.sh
wget https://raw.githubusercontent.com/cgkings/gclone-assistant/master/gdbot.sh
echo "【gclone懒人一键转存脚本】系统配置"
echo "输入配置gclone的名称"
read -p "gclone config Name:" gclone
sed -i "s/goog/$gclone/g" gdbot.sh
echo "请输入需要转存到的固定地址"
read -p "固定地址ID:" mid
sed -i "s/myid/$mid/g" gdbot.sh
chmod +x gdbot.sh
echo "请输入 ./gdbot.sh 使用脚本"
