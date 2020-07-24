#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fbtask.sh
# Author: cgking
# Created Time : 2020.7.8
# Description:全盘备份-task
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

source /root/fclone_shell_bot/myfc_config.ini
clear
echo -e " 选择你需要备份的盘
[1]. ADV盘
[2]. MDV盘
[3]. BOOK盘
[4]. 自定义 
[5]. 退出"
read -n1 -p "请输入数字 [1-5]:" num
case "$num" in
1)
    echo -e " \n "
    echo -e "★★★ 1#ADV盘 ★★★"
    myid="$jav_id"
    ;;
2)
    echo -e " \n "
    echo -e "★★★ 2#MDV盘 ★★★"
    myid="$mdv_id"
    ;;
3)
    echo -e " \n "
    echo -e "★★★ 3#BOOK盘 ★★★"
    myid="$book_id"
    ;;
4)
    read -p "请输入需要备份的盘ID==>" zdid
    zdid=${zdid#*id=};zdid=${zdid#*folders/};zdid=${zdid#*d/};zdid=${zdid%?usp*}
    if [ -z "$zdid" ] ; then
    echo "不允许输入为空" && exit
    else
    myid="$zdid"
    fi
    ;;
5)
    exit
    ;;
*)
    echo -e " \n "
    echo -e "请输入正确的数字"
    ;;
esac
read -p "请输入备份到盘ID==>" link
if [ -z "$link" ] ; then
    echo "不允许输入为空" && exit
else
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
fi
clear
echo -e "▣▣▣▣▣▣执行转存▣▣▣▣▣▣"
fclone copy "$fclone_name":{$myid} "$fclone_name":{$link} --drive-server-side-across-configs --stats=1s --stats-one-line -P --checkers="$fb_chercker" --transfers="$fb_transfer" --drive-pacer-min-sleep="$fb_min_sleep"ms --drive-pacer-burst="$fb_BURST" --min-size "$fb_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕/n"
echo -e "▣▣▣▣▣▣执行补缺▣▣▣▣▣▣"
fclone sync "$fclone_name":{$myid} "$fclone_name":{$link} --drive-server-side-across-configs --drive-use-trash=false --stats=1s --stats-one-line -P --checkers="$fb_chercker" --transfers="$fb_transfer" --drive-pacer-min-sleep="$fb_min_sleep"ms --drive-pacer-burst="$fb_BURST" --min-size "$fb_min_size"M --check-first
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  补缺完毕/n"
exit