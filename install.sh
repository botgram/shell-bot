#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fclone shell bot install
# Author: cgking
# Created Time : 2020.7.8
# Description:一键安装配置fclone shell bot
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

sh_ver="Final"

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
# 安装转存脚本-更新中
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
    echo -e "bot服务已在tmux后台窗口shellbot内启动，可直接在TG上使用，也可VPS使用“ tmux a -t shellbot”查看启动状况"
    exit
}
# 运行脚本-已完成
run_script() {
    echo -e "猪头鉴别器"
    echo -e "你是不是沙，不看安装使用说明盲选，我写，你就选吗？"
    echo -e "TG运行脚本看/help,/quick极速，/bak盘对盘备份，/p2p点对点转存"
    echo -e "VPS建议运行：./vpsfc.sh"
    exit
}
# 停止bot-更新中 
stop_bot() {
    exit
}
# 重启bot-更新中 
restart_bot() {
    exit
}
# 查看bot配置-更新中
view_bot() {
}
# 编辑配置bot-更新中
set_bot() {
}
# 查看rclone配置-更新中
view_conf() {
}
# 编辑配置rclone.conf-更新中
set_conf() {   
}
# 查看转存参数-更新中
view_clone() {
}
# 编辑转存参数-更新中
set_clone() {   
}

echo && echo -e " fclone shell bot 终结版 ${Red_font_prefix}[v${sh_ver}]${Font_color_suffix} by \033[1;35mcgkings\033[0m
 
 ${Green_font_prefix} 0.${Font_color_suffix} 完全安装
 ———————————————————————
 ${Green_font_prefix} 1.${Font_color_suffix} 安装更新 bot环境
 ${Green_font_prefix} 2.${Font_color_suffix} 安装更新 shellbot
 ${Green_font_prefix} 3.${Font_color_suffix} 安装更新 rclone/gclone/fclone
 ${Green_font_prefix} 4.${Font_color_suffix} 安装更新 转存脚本
 ———————————————————————
 ${Green_font_prefix} 5.${Font_color_suffix} 启动 bot
 ${Green_font_prefix} 6.${Font_color_suffix} 停止 bot
 ${Green_font_prefix} 7.${Font_color_suffix} 重启 bot
 ${Green_font_prefix} 8.${Font_color_suffix} 运行 脚本
 ———————————————————————
 ${Green_font_prefix} 9.${Font_color_suffix}  查看 bot配置
 ${Green_font_prefix} 10.${Font_color_suffix} 修改 bot配置
 ${Green_font_prefix} 11.${Font_color_suffix} 查看 rclone配置
 ${Green_font_prefix} 12.${Font_color_suffix} 修改 rclone配置
 ———————————————————————
 ${Green_font_prefix} 13.${Font_color_suffix} 查看 转存参数配置
 ${Green_font_prefix} 14.${Font_color_suffix} 修改 转存参数配置
 ———————————————————————" && echo
read -e -p " 请输入数字 [0-14]:" num
case "$num" in
0)
    install_exp
    install_shellbot
    install_clone
    install_script
    run_bot
    ;;
1)
    install_exp
    ;;
2)
    install_shellbot
    ;;
3)
    install_clone
    ;;
4)
    install_script
    ;;
5)
    run_bot
    ;;
6)
    stop_bot
    ;;
7)
    restart_bot
    ;;
8)
    run_script
    ;;
9)
    view_bot
    ;;
10)
    set_bot
    ;;
11)
    view_conf
    ;;
12)
    set_conf
    ;;
13)
    view_clone
    ;;
14)
    set_clone
    ;;
*)
    echo
    echo -e " ${Error} 请输入正确的数字"
    ;;
esac