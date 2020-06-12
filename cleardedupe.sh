#!/usr/bin/env bash
# 支持过滤器标签.比如.`./cleardedupe.sh cgking` 
# 将只清理用户名cgking
# 该脚本也可以通过设置过滤器flag应用到清理命令中
# 比如: ./cleardedupe.sh cgking --flag1 --flag2

filter="$1"
shift
rc_flags="$@"
#rclone listremotes | gawk "$filter"
rclone listremotes | grep "$filter"

readarray mounts < <( rclone listremotes | grep "$filter" )
for i in ${mounts[@]}; do
  echo; echo 运行DEDUPE命令查重,操作账号为: $i; echo
  rclone dedupe skip $i -v --drive-use-trash=false --no-traverse --transfers=50 $rc_flags
  echo; echo 删除空目录,操作账号为: $i; echo
  rclone rmdirs $i -v --drive-use-trash=false --fast-list --transfers=50 $rc_flags
  echo; echo 双管齐下清空垃圾桶,操作账号为: $i; echo
  rclone delete $i --fast-list --drive-trashed-only --drive-use-trash=false -v --transfers 50 $rc_flags
  rclone cleanup $i -v $rc_flags
done
