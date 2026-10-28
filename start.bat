@echo off
setlocal
rem Startet die Katzenbetreuung-App:
rem   PHP-API      -> http://localhost:8400  (Fenster "Katzenbetreuung API")
rem   Angular-App  -> http://localhost:4250  (Fenster "Katzenbetreuung App", leitet /api an 8400 weiter)
rem Beenden mit stop.bat

cd /d "%~dp0"

where php >nul 2>&1 || (echo PHP wurde nicht gefunden. Bitte PHP 8.2+ installieren bzw. in den PATH aufnehmen. & pause & exit /b 1)
where npm >nul 2>&1 || (echo Node.js/npm wurde nicht gefunden. Bitte Node.js installieren. & pause & exit /b 1)

if not exist "vendor\autoload.php" (
    echo Installiere PHP-Abhaengigkeiten ...
    call composer install --no-interaction || (pause & exit /b 1)
)
if not exist "node_modules" (
    echo Installiere npm-Abhaengigkeiten ...
    call npm install || (pause & exit /b 1)
)

call :portInUse 8400
if errorlevel 1 (
    start "Katzenbetreuung API" /min cmd /c "php -S localhost:8400 -t api/public api/public/index.php"
) else (
    echo Port 8400 ist bereits belegt - laeuft die API schon? Ggf. zuerst stop.bat ausfuehren.
)

call :portInUse 4250
if errorlevel 1 (
    start "Katzenbetreuung App" /min cmd /c "npx ng serve --port 4250 --open"
) else (
    echo Port 4250 ist bereits belegt - laeuft die App schon? Ggf. zuerst stop.bat ausfuehren.
)

echo.
echo API:  http://localhost:8400/api/bookings
echo App:  http://localhost:4250  (oeffnet sich automatisch, sobald sie bereit ist)
echo Beenden mit stop.bat
endlocal
exit /b 0

:portInUse
rem errorlevel 0 = Port belegt, 1 = frei (sprachunabhaengig, auch IPv6)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if (Get-NetTCPConnection -State Listen -LocalPort %~1 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
exit /b %errorlevel%
