#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fptask.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:点对点转存-task
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source ~/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入转存源ID==>" link1
if [ -z "$link1" ] ; then
    echo "不允许输入为空" && exit
else
link1=${link1#*id=};link1=${link1#*folders/};link1=${link1#*d/};link1=${link1%?usp*}
fi
read -p "请输入转存目标ID==>" link2
if [ -z "$link2" ] ; then
    echo "不允许输入为空" && exit
else
link2=${link2#*id=};link2=${link2#*folders/};link2=${link2#*d/};link2=${link2%?usp*}
fi
echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
fclone copy "$fclone_name":{$fp_link1} "$fclone_name":{$fp_link2} --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fp_chercker" --transfers="$fp_transfer" --drive-pacer-min-sleep="$fp_min_sleep"ms --drive-pacer-burst="$fp_BURST" --min-size "$fp_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕/n"
echo -e "▣▣▣▣▣▣执行补缺▣▣▣▣▣▣"
fclone copy "$fclone_name":{$fp_link1} "$fclone_name":{$fp_link2} --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fp_chercker" --transfers="$fp_transfer" --drive-pacer-min-sleep="$fp_min_sleep"ms --drive-pacer-burst="$fp_BURST" --min-size "$fp_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕/n"
exit