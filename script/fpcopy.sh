#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fpcopy.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:点对点转存-copy
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

echo "等待ini配置变量更新"
sleep 30s
source ~/fclone_shell_bot/myfc_config.ini
clear
echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
fclone copy "$fclone_name":{$fp_link1} "$fclone_name":{$fp_link2} --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fp_chercker" --transfers="$fp_transfer" --drive-pacer-min-sleep="$fp_min_sleep"ms --drive-pacer-burst="$fp_BURST" --min-size "$fp_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕/n"
echo -e "▣▣▣▣▣▣执行补缺▣▣▣▣▣▣"
fclone copy "$fclone_name":{$fp_link1} "$fclone_name":{$fp_link2} --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fp_chercker" --transfers="$fp_transfer" --drive-pacer-min-sleep="$fp_min_sleep"ms --drive-pacer-burst="$fp_BURST" --min-size "$fp_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕/n"