#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fcleanup.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:清空回收站
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入要清空回收站的盘ID==>" link
if [ -z "$link" ] ; then
    echo "不允许输入为空" && exit
else
    link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
fi
echo -e "▣▣▣▣▣▣▣▣清空回收站▣▣▣▣▣▣▣▣\n"
fclone delete "$fclone_nameb":{$link} --fast-list --drive-trashed-only --drive-use-trash=false --checkers="$fs_chercker" --transfers="$fs_transfer" -q --check-first
fclone rmdirs "$fclone_nameb":{$link} --fast-list --drive-trashed-only --drive-use-trash=false --checkers="$fs_chercker" --transfers="$fs_transfer" -q --check-first
echo -e "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  回收站清空完毕"