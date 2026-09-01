#!/usr/bin/env bash

# BioFoundry PlantTwin - One-Click Launcher for macOS and Linux

echo "=================================================================="
echo "  🌿 BioFoundry PlantTwin (바이오파운드리 플랜트윈) 원클릭 실행기"
echo "=================================================================="
echo ""

# Check Node.js
if command -v node >/dev/null 2>&1; then
    echo "✅ [OK] Node.js 환경이 감지되었습니다. 원클릭 서버를 구동합니다..."
    node run.js
    exit 0
fi

# Check Python3
if command -v python3 >/dev/null 2>&1; then
    echo "✅ [OK] Python3 환경이 감지되었습니다. 포트 3007 서버를 구동합니다..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:3007"
    else
        xdg-open "http://localhost:3007" >/dev/null 2>&1 &
    fi
    python3 -m http.server 3007
    exit 0
fi

echo "⚠️ [알림] Node.js 또는 Python3이 감지되지 않아 기본 브라우저로 index.html을 직접 엽니다..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "index.html"
else
    xdg-open "index.html"
fi
