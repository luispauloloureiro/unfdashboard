@echo off
echo UNF Dashboard - GitHub Synchronization Script
echo =============================================
echo.
echo This script will synchronize your project with GitHub repository:
echo https://github.com/luispauloloureiro/unfdashboard
echo.
echo Prerequisites:
echo 1. Git must be installed on your system
echo 2. You should have internet connection
echo.
pause

echo Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH
    echo Please download and install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo Adding all files to repository...
git add .

echo Creating initial commit...
git commit -m "Initial commit: UNF Dashboard"

echo Adding remote repository...
git remote add origin https://github.com/luispauloloureiro/unfdashboard.git

echo Pushing to GitHub (you may need to enter your credentials)...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Your project has been synchronized with GitHub.
    echo Repository: https://github.com/luispauloloureiro/unfdashboard
) else (
    echo.
    echo ERROR: Failed to push to GitHub.
    echo Please check:
    echo 1. Your internet connection
    echo 2. GitHub credentials
    echo 3. Repository permissions
)

pause