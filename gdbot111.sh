#!/bin/bash
read -p "请输入分享链接==》" link
# 检查接受到的分享链接规范性，并转化出分享文件ID
if [ -z "$link" ] ;then
    echo "不允许输入为空"
    exit
else
link=${link#*id=};
link=${link#*folders/};
link=${link#*d/};
link=${link%?usp*}
s1=`gclone size cgkings:{"$link"} --min-size 10M 2>&1` 
    if [[ $s1 =~ "Error 404" ]]
    then
    echo "链接无效，检查是否有权限" && exit
    else
    echo "分享链接的基本信息如下：
          "$s1"
          "file root name："$rootName""
    fi          
fi
id=$link
    j=$(gclone lsd goog:{$id} --dump bodies -vv 2>&1 | grep '^{"id"' | grep $id) rootName=$(echo $j | grep -Po '(?<="name":")[^"]*')
echo ==<<极速转存即将开始，可ctrl+c中途中断>>==
echo 【开始拷贝】......
p1=`gclone copy goog:{$link} "goog:{myid}/$rootName" --drive-server-side-across-configs --transfers=20 --min-size 10M -P -q`
echo $p1
echo 【比对检查】......
c1=`gclone check goog:{$link} "goog:{myid}/$rootName" --size-only --one-way --no-traverse --min-size 10M --log-level NOTICE`
c2=$(echo $c1 | grep 'differences')
c3=$(echo $c2 | grep -Po '(?<="':")[^differences]*')
if $c3 = "0"
then
echo 【比对ok，转存完毕】
./gdbot.sh
else
echo 【查缺补漏】......
p2='gclone copy goog:{$link} "goog:{myid}/$rootName" --drive-server-side-across-configs --transfers=20 --min-size 10M -P -q'
echo $p2
echo 【去重检查】......
d1='gclone dedupe newest "goog:{myid}/$rootName" --drive-server-side-across-configs -P -q'
echo $d1
echo 【比对检查】......
c4=`gclone check goog:{$link} "goog:{myid}/$rootName" --size-only --one-way --no-traverse --min-size 10M --log-level NOTICE`
echo $c4
./gdbot.sh