#!/bin/bash
source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入from 链接==>" link1
link1=${link1#*id=};link1=${link1#*folders/};link1=${link1#*d/};link1=${link1%?usp*}
read -p "请输入copy to链接==>" link2
link2=${link2#*id=};link2=${link2#*folders/};link2=${link2#*d/};link2=${link2%?usp*}
fclone lsf "$fclone_name":{$link1} --format "pi" --files-only -R > /root/fclone_shell_bot/log/fsingle_task.txt
IFS=$'\n'
suma=0
sumh=$(grep -n '' /root/fclone_shell_bot/log/fsingle_task.txt | awk -F : 'END{print $1}')
for input_id in $(cat /root/fclone_shell_bot/log/fsingle_task.txt | cut -d ';' -f 2)
do
suma=$((suma+1))
input_name=$(cat /root/fclone_shell_bot/log/fsingle_task.txt | grep $input_id | cut -d ';' -f 1)
input_per=$(printf "%d%%" $((suma*100/sumh)))
echo -e "▣▣▣▣▣▣▣任务信息▣▣▣▣▣▣▣\n"
echo -e "┋资源名称┋:"$input_name"\n"
echo -e "┋资源地址┋:"$input_id"\n"
echo -e "┋任务信息┋:第"$suma"项/共"$sumh"项\n"
echo -e "┋任务进度┋:"$input_per""
fclone copy "$fclone_name":{$input_id} "$fclone_name":{$link2} --drive-server-side-across-configs --fast-list --no-traverse --size-only --stats=1s --stats-one-line -P --drive-pacer-min-sleep=1ms --ignore-checksum --ignore-existing --buffer-size=50M --use-mmap --log-level=ERROR --log-file=/root/fclone_shell_bot/log/fsingle.log
done
: > /root/fclone_shell_bot/log/fsingle_task.txt
exit