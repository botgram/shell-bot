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
sed -i "s/${fp_link1}/${link1}/g" /root/fclone_shell_bot/myfc_config.ini
sed -i "s/${fp_link2}/${link2}/g" /root/fclone_shell_bot/myfc_config.ini
echo -e "/n该模式暂不支持队列任务，仅支持后台任务"
tmux new -s fptask -d
tmux send -t "fptask" '~/gclone_shell_bot/script/fpcopy.sh' Enter
echo -e "/n后台任务已开始执行"
exit