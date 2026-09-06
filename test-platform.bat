@echo off
chcp 65001 >nul
title Forma Platform Test
echo =======================================================
echo   Forma тестілеу платформасы іске қосылуда...
echo =======================================================
call npm.cmd run build:web
if %errorlevel% neq 0 (
    echo [ҚАТЕ] Құрастыру кезінде қате шықты.
    pause
    exit /b %errorlevel%
)
echo.
echo Қосымша браузерде ашылуда...
start http://localhost:3000
node scripts/serve.mjs 3000
pause
