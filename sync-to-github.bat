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
echo WARNING: This will preserve your local files and push them to GitHub
echo.
pause

echo Checking if Git is installed...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH
    echo Please download and install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo Initializing Git repository if not already initialized...
git init

echo Checking if remote repository is already configured...
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo Adding remote repository...
    git remote add origin https://github.com/luispauloloureiro/unfdashboard.git
) else (
    echo Remote repository already configured.
)

echo Adding all files to staging area...
git add .

echo Checking for changes to commit...
git diff-index --quiet HEAD >nul 2>&1
if %errorlevel% neq 0 (
    echo Creating commit with current changes...
    git commit -m "Update UNF Dashboard - %date% %time%"
) else (
    echo No changes to commit.
)

echo Pulling any remote changes first (to preserve remote data)...
git pull origin main --allow-unrelated-histories -X ours >nul 2>&1

echo Pushing to GitHub (you may need to enter your credentials)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Project synchronized with GitHub!
    echo Repository: https://github.com/luispauloloureiro/unfdashboard
    echo Your local files have been preserved and pushed to GitHub.
) else (
    echo.
    echo ERROR: Failed to push to GitHub
    echo Please check your internet connection and GitHub credentials
)

pause