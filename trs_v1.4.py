# coding=utf-8
'''
Created on 2020年4月13日

@author: Steve.x
'''
# !/usr/bin/python
import os, sys, time, json, string
import urllib.request, re, urllib.error
import pymysql

print("**************************************************")
print("*************** @Author: steve.x *****************")
print("**** ~~~~爱我你就抱抱我    爱我你就陪陪我~~~~ ****")
print("**************** gclone script *******************\r\n")

conf_file = './user.json'

with open(conf_file, 'rb') as f:
    str1 = f.read()
    r = json.loads(str1)
gpath = str(r.get("Rclone根路径"))
gconf = str(r.get("Rclone或AutoClone配置名称"))
#gtimes = int(r.get("Gclone重复次数"))
#ginterval = int(r.get("Gclone重复间隔时间"))
gdedupe = str(r.get("查重命令类型"))
groot = str(r.get("默认根目录id"))


#获取参数

host = "127.0.0.1"
username = "root"
password = ""
database = ""
#查询数据库
def querytask():
#打开数据库链接
    try:
        conn = pymysql.connect(host,username,password,database,charset='utf8')
#使用cursor() 方法创建一个游标对象 cursor
        cursor = conn.cursor()
        cursor.execute("select * from trans where status='OK' and result='待转' order by objects")
        data = cursor.fetchone()
        return data
    except BaseException as e :
        print (e)
    finally:
        cursor.close()
        conn.close()
        

#更新数据库
def updatetask(shareid):
    try:
        conn = pymysql.connect(host,username,password,database,charset='utf8') 
        #使用cursor() 方法创建一个游标对象 cursor
        cursor = conn.cursor()
        cursor.execute("update trans set result='已转' where shareid=\'"+shareid+"\'")
        conn.commit()
    except BaseException as e :
        #发生错误时回滚
        print(e)
        conn.rollback()
    finally:
        cursor.close()
        conn.close()
    

# 重复clone
def gcloneRepeat(gtimes, ginterval, realpath):
    glist = range(1, gtimes + 1)
    for i in glist:
        print("[****防止gclone文件丢失,暂停" + str(ginterval / 60) + "分钟,第" + str(i + 1) + "次执行gclone..... ****]")
        time.sleep(ginterval)
        os.system(
            gpath + "gclone copy " + gconf + ":{" + shareid + "} " + gconf + ":{" + targetid + "}" + realpath + " --drive-server-side-across-configs --ignore-checksum --ignore-existing -P --tpslimit 3")
    print("gclone " + str(gtimes) + "次命令执行完毕-----")


# 转存
def trans(shareid, targetid,title):
    dirpath = title
    realpath = "/" + ('\"' + str(dirpath) + '\"')
    print("创建文件夹: " + dirpath)
    print("[***** 执行转入操作..... *****]")
    os.system(
            gpath + "gclone copy " + gconf + ":{" + shareid + "} " + gconf + ":{" + targetid + "}" + realpath + " --drive-server-side-across-configs -v")
    if gtimes > 0:
        gcloneRepeat(gtimes, ginterval, realpath)
    print("[***** 执行查重操作..... *****]")
    os.system(gpath + "gclone dedupe " + gdedupe + " " + gconf + ":{" + targetid + "}" + realpath)
    print("查重命令执行完毕!")       
    return

while True:
	data=querytask()
	if data is None:
		print("未发现可执行任务!!!")
	else:
		objects=data[4]
		if 0<=objects<=10:
			gtimes=2
			ginterval=10
		elif 10<objects<=50:
			gtimes=2
			ginterval=20
		elif 10<objects<=100:
			gtimes=2
			ginterval=30
		elif 100<objects<=1000:
			gtimes=2
			ginterval=120
		elif 1000<objects<=5000:
			gtimes=3
			ginterval=240
		else:
			gtimes=4
			ginterval=320
		print("发现任务,开始执行!!!")
		shareid=data[2]
		title=data[3]
		print("转出id为-----:" + shareid)
		targetid=groot
		print("转入id为-----:" + targetid)
		trans(shareid, targetid,title)
		updatetask(shareid)
	time.sleep(180)
 