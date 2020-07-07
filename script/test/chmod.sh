#!/bin/bash
read -p "请输入需要可执行化的脚本名称(可附带绝对地址):" shname
chmod +x /root/gclone_shell_bot/script/test/"$shname".sh
echo "'$shname'.sh已完成可执行化"