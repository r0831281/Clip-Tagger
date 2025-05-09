@echo off
echo Starting ClipTagger application...
echo.
echo Starting backend server...
start cmd /k "cd /d d:\files\clipTager\backend && npm run dev"
echo.
echo Starting frontend application...
start cmd /k "cd /d d:\files\clipTager\frontend && npm start"
echo.
echo ClipTagger application is starting up!
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:3000
