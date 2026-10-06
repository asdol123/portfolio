@echo off
chcp 65001 > nul
echo ========================================================
echo   COMPILADOR DE PORTAFOLIO PDF - ALZADO ROJO
echo   Adolfo Risopatron Inzunza
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    node scripts\compile-pdf.js
) else (
    powershell -ExecutionPolicy Bypass -File scripts\compile-pdf.ps1
)

echo.
pause
