@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Successfully killed Node.js processes
) else (
    echo No Node.js processes found
)
pause
