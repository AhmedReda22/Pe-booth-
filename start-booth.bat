@echo off
REM ============================================================
REM  PE Booth launcher - Windows, Google Chrome
REM  Double-click this file. It opens the booth full screen,
REM  with sound allowed, from THIS folder (no internet needed).
REM  To use the online copy instead, put the site address in SITE,
REM  e.g. set "SITE=https://pe-booth.vercel.app/"
REM  Staff menu: hold the top-left corner 2 seconds.
REM ============================================================
set "SITE="
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
set "PROFILE=%LOCALAPPDATA%\PEBoothChrome"

if "%SITE%"=="" (
  set "URL=file:///%~dp0index.html#screen"
) else (
  set "URL=%SITE%#screen"
)
set "URL=%URL:\=/%"

REM autoplay-policy lets the videos play with sound without a click first.
start "" "%CHROME%" --user-data-dir="%PROFILE%" --no-first-run --disable-session-crashed-bubble --disable-infobars --disable-pinch --overscroll-history-navigation=0 --autoplay-policy=no-user-gesture-required --kiosk "%URL%"
