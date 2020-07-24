#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fpcopy.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:点对点转存
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "【点对点模式】请输入转存源ID==>" link1
link1=${link1#*id=};link1=${link1#*folders/};link1=${link1#*d/};link1=${link1%?usp*}
rootname1=$(fclone lsd "$fclone_name":{$link1} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
if [ -z "$link1" ] ; then
echo "不允许输入为空" && exit ;
elif [ -z "$rootname1" ] ; then
echo -e "读取文件夹名称出错，请反馈问题给作者/n" && exit ;
fi
read -p "请输入转存目标ID==>" link2
link2=${link2#*id=};link2=${link2#*folders/};link2=${link2#*d/};link2=${link2%?usp*}
rootname2=$(fclone lsd "$fclone_name":{$link2} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
if [ -z "$link2" ] ; then
echo "不允许输入为空" && exit ;
elif [ -z "$rootname2" ] ; then
echo -e "读取文件夹名称出错，请反馈问题给作者/n" && exit ;
fi
echo -e "▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootname1 \n"
    echo -e "┋资源地址┋:$link1 \n"
    echo -e "┋资源目标┋:$rootname2 \n"
echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
fclone copy "$fclone_name":{$link1} "$fclone_name":{$link2}/"$rootname1" --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fp_chercker" --transfers="$fp_transfer" --drive-pacer-min-sleep="$fp_min_sleep"ms --drive-pacer-burst="$fp_BURST" --min-size "$fp_min_size"M --check-first --log-level=DEBUG --log-file=/root/fclone_shell_bot/log/"$rootname1"'_fpcopy1.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕/n"
echo -e "▣▣▣▣▣▣执行补缺▣▣▣▣▣▣"
fclone copy "$fclone_name":{$link1} "$fclone_name":{$link2}/"$rootname1" --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fp_chercker" --transfers="$fp_transfer" --drive-pacer-min-sleep="$fp_min_sleep"ms --drive-pacer-burst="$fp_BURST" --min-size "$fp_min_size"M --check-first --log-level=DEBUG --log-file=/root/fclone_shell_bot/log/"$rootname1"'_fpcopy2.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕/n"
exit