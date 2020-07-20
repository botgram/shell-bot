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

source /root/fclone_shell_bot/myfc_config.ini
clear
read -p "请输入目标链接==>" link1
link1=${link1#*id=};link1=${link1#*folders/};link1=${link1#*d/};link1=${link1%?usp*}
input_info=`fclone lsjson "$fclone_name":{$link1} --fast-list --files-only --no-mimetype --no-modtime --max-depth 6`
input_ids=$(echo "$input_info" | cut  -d '"' -f 20 | sed -n '1!P;N;$q;D')
echo "$input_ids"
for input_id in $input_ids
do
   input_name=$(echo "$input_info" | grep '"'$input_id'"' | cut  -d '"' -f 8)
   echo "$input_name"
   output_names=$(cut -d ":" -f 1 /root/fclone_shell_bot/av_num.txt)
   if ( $input_names =~ *$output_names* ); then
   output_id=$(awk 'BEGIN{FS=":"}/^'$output_names'/{print $2}' /root/fclone_shell_bot/av_num.txt)
   fclone copy "$fclone_name":{$input_id} "$fclone_name":{$output_id} --fast-list --drive-server-side-across-configs --stats=1s --stats-one-line -vvP --checkers="$fq_chercker" --transfers="$fq_transfer" --drive-pacer-min-sleep="$fq_min_sleep"ms --drive-pacer-burst="$fq_BURST" --min-size "$fq_min_size"M --check-first
   else
   echo "无可整理的文件"
   fi
done
exit