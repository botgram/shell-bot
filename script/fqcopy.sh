#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fqcopy.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:极速版-copy
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source ~/fclone_shell_bot/myfc_config.ini
clear
IFS=$'\n' 
for input_id in $(cat ~/fclone_shell_bot/log/fqtask.log)
do
    rootname=$(fclone lsd "$fclone_name":{$input_id} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
    echo -e "┋资源名称┋:"$rootname"\n"
    echo -e "┋资源地址┋:"$input_id"\n"
    echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
    fclone copy "$fclone_name":{$input_id} "$fclone_name":{$gd_id}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first
    echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
    echo -e "▣▣▣▣▣▣查漏补缺▣▣▣▣▣▣"
    fclone copy "$fclone_name":{$input_id} "$fclone_name":{$gd_id}/"$rootname" --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first
    echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕"
    clear
done
: > ~/fclone_shell_bot/log/fqtask.log
exit