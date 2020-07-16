#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fsort.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:自动整理脚本
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source ~/fclone_shell_bot/myfc_config.ini

read -p "请输入要整理的链接==>" link
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
for i in $(cut -d ":" -f 1 /root/fclone_shell_bot/av_num.txt)
do
p=$(awk 'BEGIN{FS=":"}/^'$i'/{print $2}' /root/fclone_shell_bot/av_num.txt)
gclone move "$fclone_name":{$link} "$fclone_name":{$p} -vvP --fast-list --include "**$i**.*" --ignore-case --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fs_chercker" --transfers="$fs_transfer" --drive-pacer-min-sleep="$fs_min_sleep"ms --drive-pacer-burst="$fs_BURST" --min-size "$fs_min_size"M --check-first --log-level=DEBUG --log-file=~/fclone_shell_bot/log/
fclone rmdirs "$fclone_name":{$link} --fast-list --drive-use-trash=false --verbose=2 --checkers="$fs_chercker" --transfers="$fs_transfer" -q
done