#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fclone shell bot
# Author: cgking
# Created Time : 2020.7.8
# Description:极速版-task
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source ~/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入分享链接==>" link
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
rootname=$(fclone lsd "$fclone_name":{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
if [ -z "$link" ] ; then
echo "不允许输入为空" && exit ; 
elif [ -z "$rootname" ] ; then
echo "读取文件夹名称出错，请反馈问题给作者" && exit ; else
echo -e "$link" >> ~/fclone_shell_bot/log/fqtask.log
fi
read -t 5 -n1 -p "是否继续添加队列任务:[0.是/1.否]" task_stats
task_stats=${task_stats:-1}
while [[ $task_stats -eq 0 ]];do
    echo -e "/n继续添加队列任务"
    read -p "请输入分享链接==>" link
    link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
    rootname=$(fclone lsd "$fclone_name":{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
    if [ -z "$link" ] ; then
    echo "不允许输入为空" && exit ; 
    elif [ -z "$rootname" ] ; then
    echo "读取文件夹名称出错，请反馈问题给作者" && exit ; else
    echo -e "$link" >> ~/fclone_shell_bot/log/fqtask.log
    fi
    read -t 5 -n1 -p "是否继续添加队列任务:[0.是/1.否](默认1)" task_stats
    task_stats=${task_stats:-1}
done
echo -e "/n结束添加队列任务"
tmux new -s fqtask -d
tmux send -t "fqtask" '~/fclone_shell_bot/script/fqcopy.sh' Enter
~/fclone_shell_bot/script/fqtask.sh