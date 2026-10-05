@echo off
setlocal
rem Beendet die mit start.bat gestarteten Server (Ports 8400 und 4200).
rem Andere PHP-/Node-Prozesse bleiben unberuehrt.

call :stopPort 8400 "PHP-API"
call :stopPort 4200 "Angular-App"

rem Uebrig gebliebene Fenster von start.bat schliessen
taskkill /FI "WINDOWTITLE eq Katzenbetreuung API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Katzenbetreuung App*" /T /F >nul 2>&1

echo Fertig.
endlocal
exit /b 0

:stopPort
rem Sprachunabhaengig (auch IPv6): Prozesse finden, die auf dem Port lauschen, und beenden.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ids = @(Get-NetTCPConnection -State Listen -LocalPort %~1 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 });" ^
  "foreach ($id in $ids) { & taskkill.exe /PID $id /T /F | Out-Null };" ^
  "if ($ids.Count -gt 0) { exit 0 } else { exit 1 }"
if errorlevel 1 (echo %~2 auf Port %~1 lief nicht.) else (echo %~2 auf Port %~1 beendet.)
exit /b 0
