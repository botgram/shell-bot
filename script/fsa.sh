#!/bin/bash
stty erase '^H'
echo 正常的sa无输出，错误的才有，注意你的CPU负载！开始！
read -p "输入你的sa保存目录！ : " safolder
mkdir -p $safolder/invalid
read -p "输入你的remote！ : " remote
read -p "输入你的团队盘id！ : " folderid
sum_check=$(cd $safolder/invalid && ls -l | grep "^-" | wc -l)
while [ $sum_check=[0] ];do
find $safolder -type f -name "*.json" | xargs -I {} -n 1 -P 10 bash -c 'fclone lsd '$remote':{'$folderid'} --drive-service-account-file={} --drive-service-account-file-path=""  &> /dev/null || mv {} '$safolder'/invalid '
    if [ $sum_check=[0] ];then
    echo 恭喜你！你的sa检测ok！
    exit
    else
    sum_check=$(cd $safolder/invalid && ls -l | grep "^-" | wc -l)
    echo -e "已检测完毕,异常项目"$sum_check"个，即将为你开启服务"
    sumsa=0
        for saf_id in $(sort -u $safolder/invalid/*.json | grep "project_id" | awk '{print $2}' | tr -d ',"')
        do
        cd /root/AutoRclone && python3 gen_sa_accounts.py --enable-services $saf_id
        sumsa=$((sumsa+1))
        echo -e "已开启 第"$sumsa"个项目；共"$sum_check"个项目"
        echo -e "done！！！"
        done
    fi
mv $safolder/invalid/*.json $safolder
sum_check=$(cd $safolder/invalid && ls -l | grep "^-" | wc -l)
done

######safolder###                                                              ####remote#####            ###########33folderid###########          &> /dev/null
#本地存放sa的目录##                                                          ##fclone config show 查看###   #######团队盘目录id############
#######################请修改以上三个参数之后给脚本权限后执行脚本###############