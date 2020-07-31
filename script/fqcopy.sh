#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fqcopy.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:极速版-基础班
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "【极速转存模式】，请输入分享链接==>" link
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
rootname=$(fclone lsd "$fclone_name":{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
if [ -z "$link" ] ; then
echo "不允许输入为空" && exit ;
elif [ -z "$rootname" ] ; then
echo -e "读取文件夹名称出错，请反馈问题给作者,如果是全盘请用fb,此模式读不了盘名!\n" && exit ;
else
echo -e "▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootname \n"
    echo -e "┋资源地址┋:$link \n"
fi
echo -e "▣▣▣▣▣▣▣执行转存▣▣▣▣▣▣▣"
fclone copy "$fclone_name":{$link} "$fclone_name":{$gd_id}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first --log-level=ERROR --log-file=/root/fclone_shell_bot/log/fqcopy1.log
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
echo -e "▣▣▣▣▣▣查漏补缺▣▣▣▣▣▣"
fclone copy "$fclone_name":{$link} "$fclone_name":{$gd_id}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first --log-level=ERROR --log-file=/root/fclone_shell_bot/log/fqcopy2.log
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕"
exit