@echo off
chcp 65001 > nul
set "PATH=%PATH%;C:\Program Files\Git\cmd"

echo ========================================================
echo   DebtSniper - Auto Sync to GitHub
echo ========================================================
echo.

:: Configure Git User
git config --global user.name "sousixth"
git config --global user.email "nuttax.20x@gmail.com"
git config --global init.defaultBranch main

:: Initialize Git if not already done
if not exist ".git" (
    echo [*] Initializing Git repository...
    git init -b main
)

:: Set remote origin
git remote remove origin 2>nul
git remote add origin https://github.com/sousixth/Debt-Sniper.git

:: Add and commit files
echo [*] Adding files to commit...
git add index.html app.js manifest.json sw.js README.md .gitignore sync_github.bat
git commit -m "feat: launch DebtSniper with iOS glassmorphism and Supabase sync"

:: Push to GitHub
echo [*] Pushing to GitHub (https://github.com/sousixth/Debt-Sniper.git)...
git push -u origin main

echo.
echo ========================================================
echo   Done! Sync finished.
echo ========================================================
echo.
pause
