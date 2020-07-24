#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fcheck.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:定向比对
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入比对ID_1==>" link1
if [ -z "$link1" ] ; then
    echo "不允许输入为空" && exit
else
link1=${link1#*id=};link1=${link1#*folders/};link1=${link1#*d/};link1=${link1%?usp*}
fi
read -p "请输入比对ID_2==>" link2
if [ -z "$link2" ] ; then
    echo "不允许输入为空" && exit
else
link2=${link2#*id=};link2=${link2#*folders/};link2=${link2#*d/};link2=${link2%?usp*}
fi
echo -e "▣▣▣▣▣▣正在执行比对▣▣▣▣▣▣"
fclone check "$fclone_nameb":{$link1} "$fclone_nameb":{$link2} --fast-list --size-only --one-way --no-traverse --min-size "$fq_min_size"M
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  比对完毕"