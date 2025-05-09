@echo off
set BACKUP_DIR=backups
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo Creating backup directory...
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

echo Creating ClipTagger backup at %TIMESTAMP%...
docker-compose exec backend tar -czf - /usr/src/app/uploads /usr/src/app/data > %BACKUP_DIR%\cliptagger-backup-%TIMESTAMP%.tar.gz

echo Backup created: %BACKUP_DIR%\cliptagger-backup-%TIMESTAMP%.tar.gz
