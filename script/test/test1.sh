#!/bin/bash
dir=`pwd`
echo $dir
pa=${PATH%%:*}
echo $pa
rm -rf $pa/gd
rm -rf $pa/test
read -p "请输入分享链接==>" link
# 检查接受到的分享链接规范性，并转化出分享文件ID
if [ -z "$link" ] ; then echo "不允许输入为空" && exit
else
link=${link#*id=};link=${link#*folders/};link=${link#*d/};link=${link%?usp*}
foname=$(gclone lsd cgking:{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $8}')
clear
[ -z "$foname" ] && echo "无效链接" && exit
echo "链接ID: $link "
echo "文件夹名称："$foname""
fi
fname=$(gclone lsd cgking:{$link} --dump bodies -vv 2>&1 | awk 'BEGIN{FS="\""}/^{"id/{print $4}')
echo "fname是： $fname "
echo -e "\n确认保存根目录请回车\n\n输入其他字符将在此目录下创建新文件夹并copy\n"