#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fc_shellbot.sh
# Author: cgking
# Created Time : 2020.7.8--2020.7.12
# Description:一键安装配置fclone shell bot
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source ~/fclone_shell_bot/myfc_config.ini
sh_ver="Final"
Green_font_prefix="\033[32m"
Red_font_prefix="\033[31m"
Green_background_prefix="\033[42;37m"
Red_background_prefix="\033[41;37m"
Font_color_suffix="\033[0m"
Info="[${Green_font_prefix}信息${Font_color_suffix}]"
Error="[${Red_font_prefix}错误${Font_color_suffix}]"
Tip="[${Green_font_prefix}注意${Font_color_suffix}]"

# ★★★安装shellbot环境-已完成★★★
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
# ★★★安装更新shellbot-已完成★★★
install_shellbot() {
    cd ~
    botstats=`find ~/fclone_shell_bot`
    if [[ "$botstats" =~ "no such file" ]] ; then
    rm -rf ~/fclone_shell_bot
    git clone https://git.io/JJmMw
    cd ~/fclone_shell_bot
    npm install
    echo -e "shellbot已安装更新为最新版本" && exit
    else
    cd ~/fclone_shell_bot
    git pull
    echo -e "shellbot已安装更新为最新版本" 
    source /root/.bashrc
    exit
    fi
}
# ★★★安装更新rclone/gclone/fclone,fclone从本库中提取-已完成★★★
install_clone() {
    cd ~
    curl https://rclone.org/install.sh | sudo bash -s beta
    wget -qO- https://git.io/gclone.sh
    wget -N https://git.io/JJmMa
    unzip fclone.zip
    mv fclone /usr/bin
    chmod +x /usr/bin/fclone
    echo -e "rclone/gclone/fclone已安装更新为最新版本" && exit
}
# 安装转存脚本-更新中
install_script() {
    clear
    echo "【fclone转存脚本】安装"
    chmod -R 777 ~/fclone_shell_bot/script/
    echo -e "alias fq="~/fclone_shell_bot/script/fqtask.sh""  >> /root/.bashrc
    echo -e "alias fp="~/fclone_shell_bot/script/fptask.sh""  >> /root/.bashrc
    echo -e "alias fb="~/fclone_shell_bot/script/fbtask.sh""  >> /root/.bashrc
    echo -e "alias fs="~/fclone_shell_bot/script/fsize.sh""  >> /root/.bashrc
    echo -e "alias fd="~/fclone_shell_bot/script/fdedup.sh""  >> /root/.bashrc
    echo -e "alias fc="~/fclone_shell_bot/script/fcheck.sh""  >> /root/.bashrc
    echo -e "alias fcl="~/fclone_shell_bot/script/fcleanup.sh""  >> /root/.bashrc
    echo -e "alias fcshell="~/fclone_shell_bot/fcshell.sh""  >> /root/.bashrc
    source /root/.bashrc
    echo -e "已完成安装，并设置系统级脚本别名"
    echo -e "输入fcshell  安装配置脚本"
    echo -e "输入fq 启动  极速转存"
    echo -e "输入fp 启动  p2p转存"
    echo -e "输入fb 启动  盘备份转存"
    echo -e "输入fs 启动  定向size查询"
    echo -e "输入fd 启动  定向查重"
    echo -e "输入fc 启动  定向比对"
    echo -e "输入fcl 启动 定向清空回收站"
    exit
}
# ★★★运行bot-已完成★★★
run_bot() {
    clear
    tmux new -s shellbot -d
    tmux send -t "shellbot" 'cd ~/fclone_shell_bot && node server' Enter
    echo -e "bot服务已在tmux后台窗口shellbot内启动，可直接在TG上使用，也可VPS使用“ tmux a -t shellbot”查看启动状况"
    exit
}
# ★★★运行脚本-已完成★★★
run_script() {
    clear
    echo -e "┋运行脚本┋"
    sleep 2s
    echo -e "有脚本运行命令，为啥要在这运行，我写，你就选吗？"
    sleep 2s
    echo -e "请在5秒内输入“我错了”，否则将在后台运行清空团队盘，并重装VPS"
    sleep 5s
    echo -e "哎，我还是善良的，去看看使用说明吧，乖，别再选了"
    exit
}
# ★★★停止bot-已完成★★★
stop_bot() {
    clear
    tmux kill-session -t shellbot
    echo -e "bot服务已停止"
    exit
}
# ★★★重启bot-已完成★★★
restart_bot() {
    clear
    tmux kill-session -t shellbot
    tmux new -s shellbot -d
    tmux send -t "shellbot" 'cd ~/fclone_shell_bot && node server' Enter
    echo -e "bot服务已在tmux后台窗口shellbot内启动，可直接在TG上使用，也可VPS使用"tmux a -t shellbot"查看启动状况"
    exit
}
# ★★★查看bot配置-已完成★★★
view_bot() {
    clear
    cat /root/fclone_shell_bot/config.example.json
}
# ★★★编辑配置bot-已完成★★★
set_bot() {
    clear
    nano /root/fclone_shell_bot/config.example.json
}
# ★★★查看rclone配置-已完成★★★
view_conf() {
    clear
    fclone config show
}
# ★★★编辑配置rclone.conf-已完成★★★
set_conf() {
    clear
    nano /root/.config/rclone/rclone.conf
}
# ★★★查看转存参数-已完成★★★
view_clone() {
    echo -e "
 ${Green_font_prefix}1.${Font_color_suffix} 查看 fqcopy 极速模式 转存参数
 ${Green_font_prefix}2.${Font_color_suffix} 查看 fpcopy 点点模式 转存参数
 ${Green_font_prefix}3.${Font_color_suffix} 查看 fbcopy 备份模式 转存参数
 ${Green_font_prefix}4.${Font_color_suffix} 退出
 ————————————" && echo 
    read -e -p " 请输入数字 [1-3]:" view_clone_config
    case "$view_clone_config" in
1)
    echo -e "\nfqcopy 急速模式 转存参数：\n
 checker  检查线程 : ${Green_font_prefix}${fq_chercker}${Font_color_suffix}
 transfer 传输线程 : ${Green_font_prefix}${fq_transfer}${Font_color_suffix}
 min size 尺寸过滤 : ${Green_font_prefix}${fq_min_size}${Font_color_suffix}
 min-sleep休眠时间 : ${Green_font_prefix}${fq_min_sleep}${Font_color_suffix}
 BURST不休眠调用数 : ${Green_font_prefix}${fq_BURST}${Font_color_suffix}\n"
    ;;
2)
    echo -e "\nfpcopy 点点模式 转存参数：\n
 checker  检查线程 : ${Green_font_prefix}${fp_chercker}${Font_color_suffix}
 transfer 传输线程 : ${Green_font_prefix}${fp_transfer}${Font_color_suffix}
 min size 尺寸过滤 : ${Green_font_prefix}${fp_min_size}${Font_color_suffix}
 min-sleep休眠时间 : ${Green_font_prefix}${fp_min_sleep}${Font_color_suffix}
 BURST不休眠调用数 : ${Green_font_prefix}${fp_BURST}${Font_color_suffix}\n"
    ;;
3)
    echo -e "\nfpcopy 盘备份模式 转存参数：\n
 checker  检查线程 : ${Green_font_prefix}${fb_chercker}${Font_color_suffix}
 transfer 传输线程 : ${Green_font_prefix}${fb_transfer}${Font_color_suffix}
 min size 尺寸过滤 : ${Green_font_prefix}${fb_min_size}${Font_color_suffix}
 min-sleep休眠时间 : ${Green_font_prefix}${fb_min_sleep}${Font_color_suffix}
 BURST不休眠调用数 : ${Green_font_prefix}${fb_BURST}${Font_color_suffix}\n"
    ;;
4)
    exit
    ;;
*)
    echo
    echo -e " ${Error} 请输入正确的数字"
    ;;
    esac
}
# ★★★编辑转存参数-已完成★★★
set_clone() {
    clear
    nano /root/fclone_shell_bot/myfc_config.ini
}

# ★★★主目录-已完成★★★
echo && echo -e " fclone shell bot 终结版 ${Red_font_prefix}[v${sh_ver}]${Font_color_suffix} by \033[1;35mcgkings\033[0m
 
 ${Green_font_prefix} 0.${Font_color_suffix}  完全安装
 ———————————————————————
 ${Green_font_prefix} 1.${Font_color_suffix}  安装更新 bot环境
 ${Green_font_prefix} 2.${Font_color_suffix}  安装更新 shellbot
 ${Green_font_prefix} 3.${Font_color_suffix}  安装更新 rclone/fclone/fclone
 ${Green_font_prefix} 4.${Font_color_suffix}  安装更新 转存脚本
 ———————————————————————
 ${Green_font_prefix} 5.${Font_color_suffix}  启动 bot
 ${Green_font_prefix} 6.${Font_color_suffix}  停止 bot
 ${Green_font_prefix} 7.${Font_color_suffix}  重启 bot
 ${Green_font_prefix} 8.${Font_color_suffix}  运行 脚本
 ———————————————————————
 ${Green_font_prefix} 9.${Font_color_suffix}  查看 bot配置
 ${Green_font_prefix} 10.${Font_color_suffix} 修改 bot配置
 ${Green_font_prefix} 11.${Font_color_suffix} 查看 rclone配置
 ${Green_font_prefix} 12.${Font_color_suffix} 修改 rclone配置
  ———————————————————————
 ${Green_font_prefix} 13.${Font_color_suffix} 查看 脚本快捷命令
 ${Green_font_prefix} 14.${Font_color_suffix} 查看 脚本转存参数ini
 ${Green_font_prefix} 15.${Font_color_suffix} 修改 脚本转存参数ini
 ———————————————————————
 ${Green_font_prefix} 16.${Font_color_suffix} 退出 脚本" && echo 
read -e -p " 请输入数字 [0-16]:" num

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
    cat ~/fclone_shell_bot/bot_commands.txt
    ;;
14)
    view_clone
    ;;
15)
    set_clone
    ;;
16)
    exit
    ;;
*)
    echo
    echo -e " ${Error} 请输入正确的数字"
    ;;
esac