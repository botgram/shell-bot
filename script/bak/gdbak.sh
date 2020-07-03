#!/bin/bash
# 进行选项操作，默认1急速转存
run_gd_advbak() {
    echo "==<<adv备份即将开始，可ctrl+c中途中断>>=="
    echo 【开始同步adv备份1】......
    gclone sync oneking:{0AHhmaoIan8U6Uk9PVA} oneking:{0AL1vRw5scrxmUk9PVA} --drive-server-side-across-configs --min-size 10m --transfers=20 -q
    echo 【去重检查adv备份1】......
    gclone dedupe newest oneking:{0AL1vRw5scrxmUk9PVA} --drive-server-side-across-configs -q
    echo 【比对检查adv备份1】......
    gclone check oneking:{0AHhmaoIan8U6Uk9PVA} oneking:{0AL1vRw5scrxmUk9PVA} --size-only --one-way --no-traverse --min-size 10M
    echo 【开始同步adv备份2】......
    gclone sync oneking:{0AHhmaoIan8U6Uk9PVA} oneking:{0ADInnw6Q2ikGUk9PVA} --drive-server-side-across-configs --min-size 10m --transfers=20 -q
    echo 【去重检查adv备份2】......
    gclone dedupe newest oneking:{0ADInnw6Q2ikGUk9PVA} --drive-server-side-across-configs -q
    echo 【比对检查adv备份2】......
    gclone check oneking:{0AHhmaoIan8U6Uk9PVA} oneking:{0ADInnw6Q2ikGUk9PVA} --size-only --one-way --no-traverse --min-size 10M
}
run_gd_mdvbak() {
    echo "==<<mdv备份即将开始，可ctrl+c中途中断>>=="
    echo 【开始同步mdv备份1】......
    gclone sync oneking:{0AIw8vn3JYQS4Uk9PVA} oneking:{0AFgrEjPryvOFUk9PVA} --drive-server-side-across-configs --min-size 10m --transfers=20 -q
    echo 【去重检查mdv备份1】......
    gclone dedupe newest oneking:{0AFgrEjPryvOFUk9PVA} --drive-server-side-across-configs -q
    echo 【比对检查mdv备份1】......
    gclone check oneking:{0AIw8vn3JYQS4Uk9PVA} oneking:{0AFgrEjPryvOFUk9PVA} --size-only --one-way --no-traverse --min-size 10M
    echo 【开始同步mdv备份2】......
    gclone sync oneking:{0AIw8vn3JYQS4Uk9PVA} oneking:{0AKLcvqo9r4AxUk9PVA} --drive-server-side-across-configs --min-size 10m --transfers=20 -q
    echo 【去重检查mdv备份2】......
    gclone dedupe newest oneking:{0AKLcvqo9r4AxUk9PVA} --drive-server-side-across-configs -q
    echo 【比对检查mdv备份2】......
    gclone check oneking:{0AIw8vn3JYQS4Uk9PVA} oneking:{0AKLcvqo9r4AxUk9PVA} --size-only --one-way --no-traverse --min-size 10M
}
run_gd_bookbak() {
    echo "==<<book备份即将开始，可ctrl+c中途中断>>=="
    echo 【开始同步book备份1】......
    gclone sync oneking:{0AM91ZlnzD-aFUk9PVA} oneking:{0AAblPanttr8QUk9PVA} --drive-server-side-across-configs --min-size 10m --transfers=20 -q
    echo 【去重检查book备份1】......
    gclone dedupe newest oneking:{0AAblPanttr8QUk9PVA} --drive-server-side-across-configs -q
    echo 【比对检查book备份1】......
    gclone check oneking:{0AM91ZlnzD-aFUk9PVA} oneking:{0AAblPanttr8QUk9PVA} --size-only --one-way --no-traverse --min-size 10M
}
echo && echo -e " gd一键转存脚本 3 in 1版 ${Red_font_prefix}[v1.0 ${Font_color_suffix} by \033[1;35mcgkings\033[0m
 
 ${Green_font_prefix} 1.${Font_color_suffix} adv备份(默认选项，5s自动)
 ———————————————————————
 ${Green_font_prefix} 2.${Font_color_suffix} mdv备份
 ———————————————————————
 ${Green_font_prefix} 3.${Font_color_suffix} book备份
 ———————————————————————" && echo
read -t 5 -e -p " 请输入数字 [0-3]:" num
num=${num:-1}
case "$num" in
1)
    run_gd_advbak
    ;;
2)
    run_gd_mdvbak
    ;;
3)
    run_gd_bookbak
    ;;
*)
    echo
    echo -e " ${Error} 请输入正确的数字"
    ;;
esac
