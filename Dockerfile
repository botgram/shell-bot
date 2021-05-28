FROM ubuntu:20.04

RUN mkdir ./app
RUN chmod 777 ./app
WORKDIR /app

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
COPY . .
RUN chmod +x start.sh
CMD ["bash","start.sh"] 
