@echo off
title Chat Server
cd /d "%~dp0"
echo Starting Chat Server...
call npm install --omit=dev 2>nul
start http://localhost:3000
start http://localhost:3000/dashboard
node start.js
