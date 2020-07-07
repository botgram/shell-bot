#!/bin/bash
dir=`pwd`
echo $dir
read -p "请输入分享链接==>" link
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
foname=$(gclone lsd cgking:{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
count1=$(gclone size cgking:{11njoOrz1tulIUpxfyjbTKHvm_y4qx6_s} | awk 'BEGIN{FS=" "}/^Total objects/{print $3}')
size1=$(gclone size cgking:{11njoOrz1tulIUpxfyjbTKHvm_y4qx6_s} | awk 'BEGIN{FS=" "}/^Total size/{print $3}')
echo -e "文件夹名称："$foname"\n文件夹ID："$link"\n文件数量："$count1"\n文件大小："$size1" GB"
echo -e ""$foname"\n"$link"\n"$count1"\n"$size1" GB" >> /root/gclone_log/任务队列.txt
echo "已经foname,link,count,size四个变量输入/root/gclone_log/任务队列.txt中"
read -p "请输入分享链接==>" link2
link2=${link2#*id=};link2=${link2#*folders/};link2=${link2#*d/};link2=${link2%?usp*}
echo -e ""$link"\n"$link2"" >> /root/gclone_log/任务队列.txt
echo "已经将link1,link2两个任务输入/root/gclone_log/任务队列.txt中"