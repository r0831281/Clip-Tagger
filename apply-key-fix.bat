@echo off
echo Restarting ClipTagger to apply key detection fix...

REM Go to project root directory 
cd /d D:\files\clipTager

REM Stop containers
docker-compose down

REM Build with no cache for backend only
docker-compose build --no-cache backend

REM Start the containers
docker-compose up -d

echo.
echo ClipTagger has been updated and restarted.
echo The key detection logic has been fixed for C# files.
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Press any key to view logs (Ctrl+C to exit logs)
pause > nul
docker-compose logs -f
