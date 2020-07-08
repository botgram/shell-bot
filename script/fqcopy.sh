#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fclone shell bot VPS专用
# Author: cgking
# Created Time : 2020.7.8
# Description:极速版-copy
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

clear
IFS=$'\n' 
for input_id in $(cat ~/gclone_shell_bot/任务队列.txt)
do
    rootname=$(fclone lsd goog:{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
    echo -e "┋资源名称┋:"$rootname"\n"
    echo -e "┋资源地址┋:"$input_id"\n"
    echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
    fclone copy goog:{$input_id} goog:{myid}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers=128 --transfers=256 --drive-pacer-min-sleep=1ms  --min-size 10M --check-first
    echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
    echo -e "▣▣▣▣▣▣查漏补缺▣▣▣▣▣▣"
    fclone copy goog:{$input_id} goog:{myid}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers=128 --transfers=256 --drive-pacer-min-sleep=1ms  --min-size 10M --check-first
    echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
    clear
done
: > ~/gclone_shell_bot/任务队列.txt