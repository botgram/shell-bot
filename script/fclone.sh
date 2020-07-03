#!/bin/bash
# Author: cgking
# Created Time : 2020.7.1
# File Name: fclone.sh
# Description:
read -p "请输入分享链接==>" link
# 检查接受到的分享链接规范性，并转化出分享文件ID
if [ -z "$link" ] ; then
    echo "不允许输入为空" && exit
else
link=${link#*id=};
link=${link#*folders/};
link=${link#*d/};
link=${link%?usp*}
id=$link
rootName=$(fclone lsf goog:{$link} --dump bodies -vv 2>&1 | grep '"$link","name"' | cut -d '"' -f 8)
echo -e " fclone自用版 [ v1.0 by \e[1;34m cgkings \e[0m ]
请输入数字 [0-4]: (10s默认选0)
[0]. 中转盘ID转存
[1]. ADV盘ID转存
[2]. MDV盘ID转存
[3]. BOOK盘ID转存
[4]. 自定义ID转存"
read -t 10 -n1 -p -s num
num=${num:-0}
case "$num" in
0)
    myid=myid0
    echo -e "▣▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootName \n"
    echo -e "┋资源地址┋:$link \n"
    echo -e "┋转入位置┋:0#中转盘 \n"
    echo -e "┋转入地址┋:$myid \n"
    ;;
1)
    myid=myid1
    echo -e "▣▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootName \n"
    echo -e "┋资源地址┋:$link \n"
    echo -e "┋转入位置┋:1#ADV盘 \n"
    echo -e "┋转入地址┋:$myid \n"
    ;;
2)
    myid=myid2
    echo -e "▣▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootName \n"
    echo -e "┋资源地址┋:$link \n"
    echo -e "┋转入位置┋:2#MDV盘 \n"
    echo -e "┋转入地址┋:$myid \n"    
    ;;
3)
    myid=myid3
    echo -e "▣▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootName \n"
    echo -e "┋资源地址┋:$link \n"
    echo -e "┋转入位置┋:3#BOOK盘 \n"
    echo -e "┋转入地址┋:$myid \n"
    ;;
4)
    read -p "请输入自定义转存ID:" myid5
    myid=$myid5
    echo -e "▣▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣▣\n" 
    echo -e "┋资源名称┋:$rootName \n"
    echo -e "┋资源地址┋:$link \n"
    echo -e "┋转入位置┋:4#自定义盘 \n"
    echo -e "┋转入地址┋:$myid \n"
    ;;
*)
    echo
    echo -e " ${Error} 请输入正确的数字"
    ;;
    esac
fi
echo -e "▣▣▣▣▣▣▣正在执行转存▣▣▣▣▣▣▣\n"
fclone copy goog:{$link} goog:{$myid}/"$rootName" --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers=256 --transfers=320 --drive-pacer-min-sleep=1ms --check-first --min-size 10M --log-file=/root/gclone_log/"$rootName"'_copy1.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
echo -e "▣▣▣▣▣▣▣正在执行同步▣▣▣▣▣▣▣\n"
fclone sync goog:{$link} goog:{$myid}/"$rootName" --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers=256 --transfers=320 --drive-pacer-min-sleep=1ms --check-first --min-size 10M --drive-use-trash=false --log-file=/root/gclone_log/"$rootName"'_copy1.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  同步完毕"
echo -e "▣▣▣▣▣▣▣正在执行查重▣▣▣▣▣▣▣\n"
fclone dedupe newest goog:{$myid}/"$rootName" --fast-list --drive-use-trash=false --no-traverse --size-only -v --log-file=/root/gclone_log/"$rootName"'_dedupe.txt'
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  查重完毕"
echo -e "▣▣▣▣▣▣▣正在执行比对▣▣▣▣▣▣▣\n"
fclone check goog:{$link} goog:{$myid}/"$rootName" --fast-list --size-only --one-way --no-traverse --min-size 10M --checkers=320 --drive-pacer-min-sleep=1ms
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  比对完毕"
echo
echo -e "请注意清空回收站，群组账号必须对团队盘有管理员权限,10s不选默认N\n"
echo -e "⭕⭕是否要清空回收站 [Y/N]? ⭕⭕\n"
read -t 10 -n1 -p -s answer
answer=${answer:-N}
case "$answer" in
Y | y)
    echo -e "▣▣▣▣▣▣▣▣清空回收站▣▣▣▣▣▣▣▣\n"
    fclone delete goog:{$myid} --fast-list --drive-trashed-only --drive-use-trash=false --drive-server-side-across-configs --checkers=256 --transfers=128 --drive-pacer-min-sleep=1ms --drive-pacer-burst=5000 --check-first --log-level INFO --log-file=/root/gclone_log/"$rootName"'_trash.txt'
    fclone rmdirs goog:{$myid} --fast-list --drive-trashed-only --drive-use-trash=false --drive-server-side-across-configs --checkers=256 --transfers=128 --drive-pacer-min-sleep=1ms --drive-pacer-burst=5000 --check-first --log-level INFO --log-file=/root/gclone_log/"$rootName"'_rmdirs.txt'
    echo -e "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  回收站清空完毕\n"
    echo -e "日志文件存储路径/root/gclone_log/"$rootName"_(copy1/copy2/dedupe/trash/rmdirs).txt\n"
    ;;
N | n)
    echo -e "默认值：不清空回收站\n"
    echo -e "日志文件存储路径/root/gclone_log/"$rootName"_(copy1/copy2/dedupe).txt\n"
    ;;
*)
    echo
    echo -e " ${Error} 请输入正确的数字"
    ;;
esac
./fclone.sh