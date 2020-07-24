#!/bin/bash
source /root/fclone_shell_bot/myfc_config.ini
stty erase '^H'
echo 正常的sa无输出，错误的才有，注意你的CPU负载！开始！
read -p "输入你的sa保存目录！ : " safolder
mkdir -p $safolder/invalid
read -p "输入该sa目录关联的remote！ : " remote
echo running...
find $safolder -type f -name "*.json" | xargs -I {} -n 1 -P 10 bash -c 'fclone lsd '$remote':{'$gd_id'} --drive-service-account-file={} --drive-service-account-file-path=""  &> /dev/null || mv {} '$safolder'/invalid '
echo alldone

######safolder###                                                              ####remote#####            ###########33folderid###########          &> /dev/null
#本地存放sa的目录##                                                          ##fclone config show 查看###   #######团队盘目录id############
#######################请修改以上三个参数之后给脚本权限后执行脚本###############