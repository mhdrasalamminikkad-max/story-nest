@echo off
color 0A
cls
echo ========================================================
echo        STORYNEST - 100% CHILD LOCK LAUNCHER
echo ========================================================
echo.
echo Launching Kiosk Mode...
echo.
echo [!] IMPORTANT: 
echo     Because the App blocks keyboard shortcuts, 
echo     you MUST use the "Exit" button and PIN 
echo     to leave Child Mode.
echo.
echo     Once back on the Dashboard, use Alt+F4 to close.
echo.
echo ========================================================

:: Wait 2 seconds for user to read
timeout /t 2 >nul

:: Define URL (Dev server by default)
set "APP_URL=http://localhost:5173/child-fun-zone"

:: 1. Try Google Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "%APP_URL%" --disable-pinch --overscroll-history-navigation=0 --no-first-run --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'
    goto :EOF
)

:: 2. Try Google Chrome (x86)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk "%APP_URL%" --disable-pinch --overscroll-history-navigation=0 --no-first-run --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'
    goto :EOF
)

:: 3. Try Microsoft Edge (built-in fallback)
start msedge --kiosk "%APP_URL%" --edge-kiosk-type=fullscreen --disable-pinch --overscroll-history-navigation=0

exit
