#!/bin/bash
rm -rf fclone.sh
wget https://raw.githubusercontent.com/cgkings/gclone-assistant/master/script/fclone/fclone.sh
echo "【fclone一键转存脚本自用】脚本配置"
read -p "输入配置fclone的名称:" fcloneid
sed -i "s/goog/$fcloneid/g" fclone.sh
read -p "请输入0#中转盘ID（默认）:" tdid0
sed -i "s/myid0/$tdid0/g" fclone.sh
read -p "请输入1#ADV盘ID:" tdid1
sed -i "s/myid1/$tdid1/g" fclone.sh
read -p "请输入2#MDV盘ID:" tdid2
sed -i "s/myid2/$tdid2/g" fclone.sh
read -p "请输入3#BOOK盘ID:" tdid3
sed -i "s/myid3/$tdid3/g" fclone.sh
echo "如需增减目标地址，可自行修改fcloneinstall.sh和fclone.sh"
mkdir -p ~/gclone_log/
chmod +x fclone.sh
echo "请输入 ./fclone.sh 使用脚本"