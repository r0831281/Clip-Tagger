@echo off
echo Rebuilding ClipTagger Docker containers...

REM Stop any running containers
docker-compose down

REM Remove old images
docker-compose rm -f

REM Build with no cache to ensure a clean build
docker-compose build --no-cache

REM Start the containers in detached mode
docker-compose up -d

echo.
echo ClipTagger has been rebuilt and restarted.
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Press any key to view logs (Ctrl+C to exit logs)
pause > nul
docker-compose logs -f
