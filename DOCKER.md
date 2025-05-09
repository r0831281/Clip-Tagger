# ClipTagger Docker Setup

This directory contains Docker configuration for running the ClipTagger application in containers.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git (to clone the repository)

## Getting Started

1. Clone the repository (if you haven't already):
   ```
   git clone <repository-url>
   cd cliptagger
   ```

2. Configure your environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file and add your OpenAI API key if you want to use AI analysis.

3. Use the provided script to build and start the containers:
   ```
   start-docker.bat
   ```
   
   Or manually with Docker Compose:
   ```
   docker-compose up -d
   ```
   
4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

## Helper Scripts

The following scripts are provided for easier management:

- `start-docker.bat` - Start the containers and display logs
- `stop-docker.bat` - Stop all running containers
- `rebuild-docker.bat` - Rebuild and restart all containers (after code changes)
- `backup-docker.bat` - Create a backup of all uploaded files and data

## Data Persistence

The application uses Docker volumes for data persistence:

- `backend-uploads`: Stores all uploaded audio files
- `backend-data`: Stores the clips database (test-clips.json)

These volumes ensure your data is preserved even if the containers are removed.

## Backups

You can create backups of your data using the provided script:
```
backup-docker.bat
```

This will create a timestamped backup file in the `backups` directory.

## Stopping the Application

To stop the application, use the provided script:
```
stop-docker.bat
```

Or manually with Docker Compose:
```
docker-compose down
```

To stop and remove volumes (this will delete all data):
```
docker-compose down -v
```

## Health Checks

Both containers include health checks:

- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000/health

You can monitor the health status with:
```
docker-compose ps
```

## Troubleshooting

- Check container logs:
  ```
  docker-compose logs
  ```

- Check specific service logs:
  ```
  docker-compose logs backend
  docker-compose logs frontend
  ```

- Restart services:
  ```
  docker-compose restart backend
  docker-compose restart frontend
  ```

- Check container health:
  ```
  docker inspect --format='{{.State.Health.Status}}' cliptagger-backend
  docker inspect --format='{{.State.Health.Status}}' cliptagger-frontend
  ```

## Updating the Application

When you pull new changes from the repository:

```
git pull
rebuild-docker.bat
```

This will rebuild the images with the latest code and restart the services.
