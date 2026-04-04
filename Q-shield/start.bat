@echo off
echo.
echo  ================================================
echo   Q-Shield Platform ^| Starting Dev Environment
echo  ================================================
echo.
echo  [1/2] Starting Backend (Express ^| Port 5000)...
echo  [2/2] Starting Frontend (Vite ^| Port 5173)...
echo.
echo  Backend:   http://localhost:5000
echo  Frontend:  http://localhost:5173
echo.
start "Q-Shield Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak >nul
start "Q-Shield Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo  Both servers are starting in separate windows!
echo  Close those windows to stop the servers.
