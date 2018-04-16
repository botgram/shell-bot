#!/bin/sh
git reset --hard master
git pull
node server.js
