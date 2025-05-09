@echo off
echo Starting ClipTagger with Docker Compose...

if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
    echo Please edit .env file with your API key if needed
    timeout /t 5
)

REM Stop any previous instances
docker-compose down

REM Build the images
docker-compose build

REM Start the containers
docker-compose up -d

echo.
echo ClipTagger is starting...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Press any key to view logs (Ctrl+C to exit logs)
pause > nul
docker-compose logs -f
