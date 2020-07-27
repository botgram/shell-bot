#!/bin/bash
stty erase '^H'
echo 正常的sa无输出，错误的才有，注意你的CPU负载！开始！
read -p "输入gen_sa_accounts.py所在目录！：" pyfolder
read -p "输入你的sa保存目录！ : " safolder
mkdir -p $safolder/invalid
read -p "输入该sa目录关联的remote！ : " remote
read -p "输入已加群的团队盘Id(建议文件少的）！ : " gd_id
echo running...
find $safolder -type f -name "*.json" | xargs -I {} -n 1 -P 10 bash -c 'fclone lsd '$remote':{'$gd_id'} --drive-service-account-file={} --drive-service-account-file-path=""  &> /dev/null || mv -v {} '$safolder'/invalid '
sum_check=$(cd $safolder/invalid && ls -l | grep "^-" | wc -l)
echo -e "已检测完毕,异常项目"$sum_check"个，即将针对异常开启服务"
sumsa=0
for saf_id in $(cat $safolder/invalid/*.json | grep "project_id" | awk '{print $2}' | tr -d ',"')
do
cd $pyfolder && python3 gen_sa_accounts.py --enable-services $saf_id
sumsa=$((sumsa+1))
echo -e "已开启 第"$sumsa"个项目；共"$sum_check"个项目"
done
echo 服务已全部开启完毕！











######safolder###                                                              ####remote#####            ###########33folderid###########          &> /dev/null
#本地存放sa的目录##                                                          ##fclone config show 查看###   #######团队盘目录id############
#######################请修改以上三个参数之后给脚本权限后执行脚本###############