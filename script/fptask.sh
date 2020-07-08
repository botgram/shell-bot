#!/bin/bash
#=============================================================
# https://github.com/cgkings/fclone_shell_bot
# File Name: fclone shell bot quick script
# Author: cgking
# Created Time : 2020.7.8
# Description:一键极速转存
# System Required: Debian/Ubuntu
# Version: final
#=============================================================

# 运行bot-已完成
check_info() {
    link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
    rootname=$(gclone lsd goog:{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
}
read -p "请输入分享链接==>" link
if [ -z "$link" ] ; then
    echo "不允许输入为空" && exit
    else
    read -t 10 -n1 -p "是否增加任务序列(10s默认N,回复Y增加序列)" task_stats
    task_stats=${task_stats:-N}
    


rootName=$(fclone lsf goog:{$id} --dump bodies -vv 2>&1 | grep '"'$id'","name"' | cut -d '"' -f 8)
echo -e "▣▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootName \n"
    echo -e "┋资源地址┋:$link \n"
fi
echo -e " fclone自用版 [ v1.0 by \e[1;34m cgkings \e[0m ]
[0]. 中转盘ID转存
[1]. ADV盘ID转存
[2]. MDV盘ID转存
[3]. BOOK盘ID转存
[4]. 自定义ID转存"
read -t 10 -n1 -p "请输入数字 [0-4]: (10s默认选0)" num
num=${num:-0}
case "$num" in
0)
    echo -e " \n "
    echo -e "★★★ 0#中转盘 ★★★"
    myid=myid0
    ;;
1)
    echo -e " \n "
    echo -e "★★★ 1#ADV盘 ★★★"
    myid=myid1
    ;;
2)
    echo -e " \n "
    echo -e "★★★ 2#MDV盘 ★★★"
    myid=myid2
    ;;
3)
    echo -e " \n "
    echo -e "★★★ 3#BOOK盘 ★★★"
    myid=myid3
    ;;
4)
    echo -e " \n "
    echo -e "★★★ 4#自定义盘 ★★★"
    echo -e "\n"
    read -p "请输入自定义转存ID:" myid5
    myid=$myid5
    ;;
*)
    echo -e " \n "
    echo -e "请输入正确的数字"
    ;;
esac
echo -e " \n "
echo -e "▣▣▣▣▣▣正在执行转存▣▣▣▣▣▣"
fclone copy goog:{$link} goog:{$myid}/"$rootName" --drive-server-side-across-configs -vP --checkers=128 --transfers=256 --drive-pacer-min-sleep=1ms --drive-pacer-burst=5000 --check-first --stats-one-line --stats=1s --min-size 10M --log-file=/root/gclone_log/"$rootName"'_copy1.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
echo -e "▣▣▣▣▣▣正在执行同步▣▣▣▣▣▣"
fclone sync goog:{$link} goog:{$myid}/"$rootName" --drive-server-side-across-configs -vP --checkers=128 --transfers=256 --drive-pacer-min-sleep=1ms --drive-pacer-burst=5000 --check-first --drive-use-trash=false --stats-one-line --stats=1s --min-size 10M --log-file=/root/gclone_log/"$rootName"'_copy2.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  同步完毕"
echo -e "▣▣▣▣▣▣正在执行查重▣▣▣▣▣▣"
fclone dedupe newest goog:{$myid}/"$rootName" --fast-list --drive-use-trash=false --no-traverse --size-only -v --log-file=/root/gclone_log/"$rootName"'_dedupe.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  查重完毕"
echo -e "▣▣▣▣▣▣正在执行比对▣▣▣▣▣▣"
fclone check goog:{$link} goog:{$myid}/"$rootName" --fast-list --size-only --one-way --no-traverse --min-size 10M --checkers=64 --drive-pacer-min-sleep=1ms
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  比对完毕"
echo
echo -e "请注意清空回收站，群组账号必须对团队盘有管理员权限,10s不选默认N"
echo -e "\n"
read -t 10 -n1 -p "是否要清空回收站 [Y/N]?" answer
answer=${answer:-N}
case "$answer" in
Y | y)
    echo -e " \n "
    echo -e "▣▣▣▣▣▣▣▣清空回收站▣▣▣▣▣▣▣▣\n"
    fclone delete goog:{$myid} --fast-list --drive-trashed-only --drive-use-trash=false --drive-server-side-across-configs --checkers=64 --transfers=128 --drive-pacer-min-sleep=1ms --drive-pacer-burst=5000 --check-first --log-level INFO --log-file=/root/gclone_log/"$rootName"'_trash.txt'
    fclone rmdirs goog:{$myid} --fast-list --drive-trashed-only --drive-use-trash=false --drive-server-side-across-configs --checkers=64 --transfers=128 --drive-pacer-min-sleep=1ms --drive-pacer-burst=5000 --check-first --log-level INFO --log-file=/root/gclone_log/"$rootName"'_rmdirs.txt'
    echo -e "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  回收站清空完毕"
    echo -e "日志文件存储路径/root/gclone_log/"$rootName"_(copy1/copy2/dedupe/trash/rmdirs).txt"
    ;;
N | n)
    echo -e " \n "
    echo -e "默认值：不清空回收站"
    echo -e "日志文件存储路径/root/gclone_log/"$rootName"_(copy1/copy2/dedupe).txt"
    ;;
*)
    echo -e " \n "
    echo -e "请输入正确的数字"
    ;;
esac
./fclone.sh