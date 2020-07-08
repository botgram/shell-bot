#!/bin/bash
# Author: cgking
# Created Time : 2020.7.8
# File Name: fclone shell bot install
# Description:一键安装配置fclone shell bot

# 安装shellbot环境-已完成
install_exp() {
    cd ~
    apt update -y &&　apt upgrade -y
    apt install wget curl screen git tree vim nano tmux htop sudo python3-distutils -y
    apt install python3 python3-pip -y
    curl "https://bootstrap.pypa.io/get-pip.py" -o "get-pip.py"
    python3 get-pip.py
    sudo -i
    pip3 install pipenv
    pip3 install delegator.py
    pip3 install python-telegram-bot
    pip3 install pysocks
    sudo apt install nodejs
    sudo apt install -y make python build-essential
    echo -e "shellbot环境已安装完毕" && exit
}
# 安装更新shellbot-已完成
install_shellbot() {
    cd ~
    botstats=`find ~/gclone_shell_bot`
    if [[ "$botstats" =~ "no such file" ]] ; then
    rm -rf ~/gclone_shell_bot
    git clone https://github.com/cgkings/gclone_shell_bot.git
    cd ~/gclone_shell_bot
    npm install
    exit
    else
    cd ~/gclone_shell_bot
    git pull
    echo -e "shellbot已安装更新为最新版本" && exit
    fi
}
# 安装更新rclone/gclone/fclone-已完成
install_clone() {
    cd ~
    curl https://rclone.org/install.sh | sudo bash -s beta
    bash <(wget -qO- https://git.io/gclone.sh)
    wget -N https://raw.githubusercontent.com/cgkings/fclone_shell_bot/master/fclone/fclone.zip
    unzip fclone.zip
    mv fclone /usr/bin
    chmod +x /usr/bin/fclone
    echo -e "rclone/gclone/fclone已安装更新为最新版本" && exit
}
# 安装转存脚本-
install_script() {
    rm -rf fclone.sh
    clear
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
    chmod +x fclone.sh
    echo "请输入 ./fclone.sh 使用脚本"
}
# 运行bot-已完成
run_bot() {
    tmux new -s shellbot -d
    tmux send -t "shellbot" 'cd ~/gclone_shell_bot && node server' Enter
    echo -e "bot服务已在tmux后台窗口shellbot内启动，可直接在TG上使用，也可VPS使用“ tmux a -t shellbot”查看启动状况" && exit
}
# 运行脚本-已完成
    echo -e "猪头鉴别器"
    echo -e "你是不是沙，不看安装使用说明盲选，我写，你就选吗？"
    echo -e "TG运行脚本看/help,/quick极速，/bak盘对盘备份，/p2p点对点转存"
    echo -e "VPS建议运行：./vpsfc.sh"
    exit
# 编辑配置bot-未完成
edit_script() {
}
# 编辑配置rclone.conf-未完成
set_conf() {   
}
# 编辑配置转存脚本-未完成
set_script() {   
}
