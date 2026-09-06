@echo off
chcp 65001 >nul
title Forma Metro Dev Server
echo =======================================================
echo   Forma Metro сервері іске қосылуда...
echo =======================================================
call npx.cmd expo start
pause
