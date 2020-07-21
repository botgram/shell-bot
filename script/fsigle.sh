#!/bin/bash
source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入目标链接==>" link1
link1=${link1#*id=};link1=${link1#*folders/};link1=${link1#*d/};link1=${link1%?usp*}
read -p "请输入目的地链接==>" link2
link2=${link2#*id=};link2=${link2#*folders/};link2=${link2#*d/};link2=${link2%?usp*}
for input_id in $(fclone lsf "$fclone_name":{$link1} --format "i" --files-only -R)
do
fclone copy "$fclone_name":{$input_id} "$fclone_name":{$link2} --fast-list --drive-server-side-across-configs --stats=1s --stats-one-line -vP --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first
done
exit