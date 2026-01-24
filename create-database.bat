@echo off
echo Creating StoryNest Database...
echo.
echo This script will create a PostgreSQL database for StoryNest
echo Default PostgreSQL credentials are used (postgres/postgres)
echo.
pause

psql -U postgres -c "CREATE DATABASE storynest;"
if %errorlevel% equ 0 (
    echo.
    echo ✅ Database 'storynest' created successfully!
    echo.
) else (
    echo.
    echo ⚠️  Database might already exist or PostgreSQL is not installed
    echo.
)

pause
