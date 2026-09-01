@echo off
chcp 65001 >nul
title BioFoundry PlantTwin - One-Click Launcher

echo ==================================================================
echo   🌿 BioFoundry PlantTwin (바이오파운드리 플랜트윈) 원클릭 실행기
echo ==================================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js 환경이 감지되었습니다. 원클릭 서버를 구동합니다...
    node run.js
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python 환경이 감지되었습니다. 포트 3007 서버를 구동합니다...
    start http://localhost:3007
    python -m http.server 3007
    goto end
)

echo [주의] Node.js 또는 Python이 설치되어 있지 않습니다.
echo 브라우저에서 index.html 파일을 직접 실행합니다...
start index.html

:end
pause
