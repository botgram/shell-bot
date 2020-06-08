#!/bin/bash
# Author: cgking
# Created Time : 2020.6.4
# File Name: gdbot.sh
# Description:
read -p "请输入分享链接==>" link
# 检查接受到的分享链接规范性，并转化出分享文件ID
if [ -z "$link" ] ; then
    echo "不允许输入为空" && exit
else
j=$(gclone ls goog:{$link} --dump bodies -vv 2>&1 | grep '^{"id"') rootName=$(echo $j | grep -Po '(?<="name":")[^"]*')
    if [[ "$j" =~ "Error 404" ]] ; then
    echo "链接无效，检查是否有权限" && exit
    else
    echo "文件夹名称为："$rootName""
    fi
fi
echo "==<<极速转存即将开始，可ctrl+c中途中断>>=="
echo 【开始拷贝】......
gclone copy oneking:{$link} "goog:{myid}/$rootName" --drive-server-side-across-configs --transfers=20 --min-size 10M -q
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
echo 【查缺补漏】......
gclone copy oneking:{$link} "goog:{myid}/$rootName" --drive-server-side-across-configs --transfers=20 --min-size 10M -q
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  拷贝完毕"
echo 【去重检查】......
gclone dedupe newest "goog:{myid}/$rootName" --drive-server-side-across-configs -q
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  查重完毕"
echo 【比对检查】......
gclone check goog:{$link} goog:{myid}/"$rootName" --size-only --one-way --no-traverse --min-size 10M
echo "|▉▉▉▉▉▉▉▉▉▉▉▉|100%  检查完毕"
./gdbot.sh
