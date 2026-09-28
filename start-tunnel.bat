@echo off
title Cloudflare Tunnel for XAMPP
echo ========================================================
echo Starting Cloudflare Tunnel for XAMPP (Port 80)...
echo ========================================================
echo.
echo Make sure XAMPP Apache is running!
echo Tunnel log is being saved to cloudflared.log
echo.
.\cloudflared.exe tunnel --url http://localhost:80
pause
