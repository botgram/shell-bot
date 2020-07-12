#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fbcopy.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:全盘备份-copy
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

echo "等待ini配置变量更新"
sleep 30s
source ~/fclone_shell_bot/myfc_config.ini
clear
echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
fclone copy "$fclone_name":{$fb_link1} "$fclone_name":{$fb_link2} --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fb_chercker" --transfers="$fb_transfer" --drive-pacer-min-sleep="$fb_min_sleep"ms --drive-pacer-burst="$fb_BURST" --min-size "$fb_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕/n"
echo -e "▣▣▣▣▣▣执行补缺▣▣▣▣▣▣"
fclone sync "$fclone_name":{$fb_link1} "$fclone_name":{$fb_link2} --drive-server-side-across-configs --drive-use-trash=false --stats=1s --stats-one-line -vP --checkers="$fb_chercker" --transfers="$fb_transfer" --drive-pacer-min-sleep="$fb_min_sleep"ms --drive-pacer-burst="$fb_BURST" --min-size "$fb_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕/n"
exit