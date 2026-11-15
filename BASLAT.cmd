@echo off
setlocal
cd /d "%~dp0"
title KasaFlow
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 kurulumu gerekli. https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo.
echo KasaFlow: http://localhost:3000
echo Ornek veri: http://localhost:3000/demo
echo Bu pencere acik kaldigi surece uygulama calisir.
echo.
call npm run dev
if errorlevel 1 pause
