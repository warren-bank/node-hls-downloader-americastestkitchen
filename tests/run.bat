@echo off

set DIR=%~dp0.
set workspace=%DIR%\workspace

if exist "%workspace%" rmdir /Q /S "%workspace%"
mkdir "%workspace%"
cd "%workspace%"

call npm init -y
call npm install --save "%DIR%\.."
cls

set PATH=%workspace%\node_modules\.bin;%PATH%

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download an episode (by URL)
rem ::
rem :: Season 20, Ep 7 - The Very Best Paris-Brest
rem :: =================================

call atkdl -q -mc 5 -u "https://www.americastestkitchen.com/episode/653-the-very-best-paris-brest"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download an episode (by CLI options)
rem ::
rem :: Season 20, Ep 7 - The Very Best Paris-Brest
rem :: =================================

call atkdl -q -mc 5 -s 20 -e 7

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download all episodes in one season
rem ::
rem :: Season 20
rem :: =================================

call atkdl -q -mc 5 -s 20

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download all episodes in all seasons
rem :: =================================

call atkdl -q -mc 5 -a

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: print a trace of the operations that would occur
rem :: IF all episodes in one season were to be downloaded
rem ::
rem :: Season 20
rem :: =================================

call atkdl -dr -ll 1 -s 20
call atkdl -dr -ll 2 -s 20
call atkdl -dr -ll 3 -s 20

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: download all episodes in one season (advanced)
rem ::
rem :: Season 20
rem :: =================================

call atkdl -dr -ll 1 -s 20 >"episode_urls.txt"
call atkdl -dr -ll 2 -s 20 >"convert_mp4s.bat"

call atkdl -nm -mc 5 -i "episode_urls.txt" >"log.txt" 2>&1

call "convert_mp4s.bat"

rem :: -------------------------------------------------------------------------

echo.
pause
