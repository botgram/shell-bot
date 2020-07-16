#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fqcopy_a.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:极速版-多任务版
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入分享链接==>" link
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
rootname=$(fclone lsd "$fclone_name":{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
if [ -z "$link" ] ; then
echo "不允许输入为空" && exit ; 
else
echo -e "$link" >> /root/fclone_shell_bot/log/fqtask.log
fi
while [[ $link -ne 0 ]];do
    if [ -z "$rootname" ] ; then
    echo -e "读取文件夹名称出错，请反馈问题给作者/n"
    echo -e "如fqtask.log还有任务ID，则直接进行copy/n"
    sed -i '$d' /root/fclone_shell_bot/log/fqtask.log
    break ;
    fi
    echo -e "/n请继续添加队列任务"
    read -p "请继续输入分享链接任务，如需终止添加队列则回复"0"==>" link
    link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
    rootname=$(fclone lsd "$fclone_name":{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
    if [ -z "$link" ] ; then
    echo -e "不允许输入为空"
    echo -e "如fqtask.log还有任务ID，则直接进行copy/n"
    break ; 
    else
    echo -e "$link" >> /root/fclone_shell_bot/log/fqtask.log
    fi
done
if [ -z "$rootname" ] ; then
sed -i '$d' /root/fclone_shell_bot/log/fqtask.log
fi
echo -e "/n结束添加,队列任务即将开始执行/n"
clear
if [ -s /root/fclone_shell_bot/log/fqtask.log ] ; then
IFS=$'\n' 
for input_id in $(cat ~/fclone_shell_bot/log/fqtask.log)
do
rootname=$(fclone lsd "$fclone_name":{$input_id} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
echo -e "┋资源名称┋:"$rootname"\n"
echo -e "┋资源地址┋:"$input_id"\n"
echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
fclone copy "$fclone_name":{$input_id} "$fclone_name":{$gd_id}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first --log-level=DEBUG --log-file=/root/fclone_shell_bot/log/"$rootName"'_fqcopy1.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
echo -e "▣▣▣▣▣▣查漏补缺▣▣▣▣▣▣"
fclone copy "$fclone_name":{$input_id} "$fclone_name":{$gd_id}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first --log-level=DEBUG --log-file=/root/fclone_shell_bot/log/"$rootName"'_fqcopy2.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕"
clear
done
: > /root/fclone_shell_bot/log/fqtask.log
exit
else
echo "/root/fclone_shell_bot/log/fqtask.log为空，即将退出" && exit ; 
fi