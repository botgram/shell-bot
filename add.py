# coding=utf-8
'''
Created on 2020年4月13日

@author: Steve.x
'''
# !/usr/bin/python3
import os, sys, time, json, string
import urllib.request, re, urllib.error
import pymysql


#获取参数

host = "127.0.0.1"
username = "root"
password = ""
database = ""


#查询数据库
def querytask(cursor,url):
	
	    tasknum=cursor.execute("select * from trans where url="+"\'"+url+"\'")	
	    return tasknum
             
def insert(url,shareid,title,objects,size,status,result):
#打开数据库链接
    conn = pymysql.connect(host,username,password,database,charset='utf8')
#使用cursor() 方法创建一个游标对象 cursor
    cursor = conn.cursor()
    print("开始------------------------------\n")
    #Sql 插入语句
    if querytask(cursor,url) ==0:
        sql = "insert into trans(url,shareid,title,objects,size,status,result) values("+"\'"+url+"\',\'"+shareid+"\',\'"+title+"\',\'"+objects+"\',\'"+size+"\',\'"+status+"\',\'"+result+"\')"
        print ("新增任务id: "+shareid+"\n资源名: "+title+"\n资源文件数目: "+objects+"\n资源大小: "+size+"\n资源状态: "+status+"\n转存结果: "+result+"\n")
    else:
        sql= "update trans set objects=\'"+objects+"\',size=\'"+size+"\',status=\'"+status+"\',result=\'"+result+"\' where url=\'"+url+"\'"
        print ("更新任务id: "+shareid+"\n资源名: "+title+"\n资源文件数目: "+objects+"\n资源大小: "+size+"\n资源状态: "+status+"\n转存结果: "+result+"\n")
    try:
        #执行sql
        print("执行------------------------------")
        tt = cursor.execute(sql)
        print("新增任务"+str(tt)+"条")
        conn.commit()
    except BaseException as e :
        #发生错误时回滚
        print(e)
        conn.rollback()
    finally:
             cursor.close()
             conn.close()

# 获取资源标题
def getname(shareurl):

    try:

        page = urllib.request.urlopen(shareurl)
        html = page.read().decode('utf-8')
        title = re.findall('<title>(.+)</title>', html)[0]
        if title == "Meet Google Drive – One place for all your files":
            print("异常原因-----:No privilege")
            exit
        else:
            title=re.sub(" - Google.*","",title).strip()
            if title.endswith((".iso",".zip",".avi",".mkv",".mp4",".rar",".7z",".m2ts")):
                title=re.sub('\.iso|\.zip|\.avi|\.mkv|\.mp4|\.rar,|\.7z|\.m2ts',"",title)
                return title
            else:
                return title
    except urllib.error.URLError as e:
        print("异常原因-----:" + e.reason)
        print("退出.....")
        exit
     

while True:
	shareurl=input("请输入预转出url地址-----:")
	if "drive.google.com" in shareurl:
	    urlList = shareurl.split("/")
	    urlsort = sorted(urlList, key=lambda i: len(i), reverse=True)
	    if len(urlsort[0]) > 20:
	        if "open?id=" in urlsort[0]:
	            idList = urlsort[0].split("=")
	            shareid = idList[1]
	        elif "?usp=" in urlsort[0]:
	            idList = urlsort[0].split("?")
	            shareid = idList[0]
	        else:
	            shareid = urlsort[0]
	title=getname(shareurl)
	if title is None:
		exit
	else:
		size_info=os.popen("gclone size frreq46:{"+shareid+"}")
		size_read=size_info.read()
		size_arr=(size_read.split("\n"))
		objects=((size_arr[0]).split(":"))[1].strip()
		size=((size_arr[1]).split(":"))[1].strip()
		if objects==0:
			status="No Profile"
			result="无文件"
		else:
			status="OK"
			result="待转"
		
		insert(shareurl,shareid,title,objects,size,status,result)

