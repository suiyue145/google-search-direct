@echo off
title Google Search Direct - One-click Installer
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1"
if errorlevel 1 (
  echo.
  echo Installer exited with an error. Please read the messages above.
  pause
)
