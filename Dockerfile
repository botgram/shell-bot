FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Kolkata
RUN apt upgrade -y
RUN apt update -y
RUN apt install -y git
#Installs python and build-essential
RUN apt install -y make python build-essential nodejs npm \
        ffmpeg \
        youtube-dl \
        streamlink \
        aria2 \
        megatools \
        qbittorrent-nox \
        rar unrar \
        p7zip

#Runs npm install
CMD npm install
#Starts the bot
CMD node server
