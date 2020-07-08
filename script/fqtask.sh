#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fclone shell bot VPS专用
# Author: cgking
# Created Time : 2020.7.8
# Description:极速版-task
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

clear
read -p "请输入分享链接==>" link
if [ -z "$link" ] ; then
echo "不允许输入为空" && exit ; else
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
fi
echo -e "$link" >> ~//gclone_shell_bot/任务队列.txt
read -t 5 -n1 -p "是否继续添加队列任务:[0.是/1.否]" task_stats
task_stats=${task_stats:-1}
while [[ $task_stats -eq 0 ]];do
    echo -e "/n继续添加队列任务"
    read -p "请输入分享链接==>" link
    if [ -z "$link" ] ; then
    echo "不允许输入为空" && exit ; else
    link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
    fi
    echo -e "$link" >> ~/gclone_shell_bot/任务队列.txt
    read -t 5 -n1 -p "是否继续添加队列任务:[0.是/1.否](默认1)" task_stats
    task_stats=${task_stats:-1}
done
echo -e "/n结束添加队列任务"
tmux new -s fctask -d
tmux send -t "fctask" 'cd ~ && ./fqcopy.sh' Enter
./fc.sh