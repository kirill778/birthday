@echo off
echo ===============================
echo Запуск сервера синхронизации
echo ===============================
echo.
echo IP-адреса в вашей сети (для доступа с других устройств):
ipconfig | findstr IPv4
echo.
echo Порт сервера: 5000
echo.
echo Для остановки сервера нажмите Ctrl+C
echo ===============================
echo.
python server.py
pause 