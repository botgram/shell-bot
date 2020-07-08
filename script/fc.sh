#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fclone shell bot VPS专用
# Author: cgking
# Created Time : 2020.7.8
# Description:VPS专用脚本
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

clear
read -p "请输入分享链接==>" link
if [ -z "$link" ] ; then
echo "不允许输入为空" && exit ; else
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
ls_info=`rclone lsd goog:{$link} --dump bodies -vv 2>&1`
size_info=`fclone size goog:{$link} --checkers=256`
rootname=$(echo "$ls_info" | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
idname=$(echo "$ls_info" | awk 'BEGIN{FS="\""}/^{"id/{print $4}')
file_num=$(echo "$size_info" | awk 'BEGIN{FS=" "}/^Total objects/{print $3}')
file_size=$(echo "$size_info" | awk 'BEGIN{FS=" "}/^Total size/{print $3,$4}')
[ -z "$rootname" ] && echo "无效链接" && exit || [ $link != $idname ] && echo "链接无效，检查是否有权限" && exit
fi
echo -e "▣▣▣▣▣▣任务信息▣▣▣▣▣▣\n"
echo -e "┋资源名称┋:"$rootname"\n"
echo -e "┋转存地址┋:中转盘/未整理/"$rootname"\n"
echo -e "┋资源数量┋:"$file_num"\n"
echo -e "┋资源大小┋:"$file_size"\n"
echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
fclone copy goog:{$link} goog:{myid}/"$rootname" --drive-server-side-across-configs -vP --checkers=256 --transfers=320 --drive-pacer-min-sleep=1ms --drive-pacer-burst=5000 --check-first --stats-one-line --stats=1s --min-size 10M
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
echo -e "▣▣▣▣▣▣执行比对▣▣▣▣▣▣"
fclone check goog:{$link} goog:{myid}/"$rootname" --fast-list --size-only --one-way --no-traverse --min-size 10M --checkers=64 --drive-pacer-min-sleep=1ms
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  比对完毕"
clear
./fc.sh