#!/bin/sh
git reset --hard master
git pull
npm install
node server.js
