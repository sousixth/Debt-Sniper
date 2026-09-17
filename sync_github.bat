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
echo [*] Adding all updated files...
git add -A
git commit -m "feat: update to Image 2 & 3 luxury UI with Network-First cache busting and 1-click dashboard entry" 2>nul

:: Push to GitHub
echo [*] Pushing to GitHub (https://github.com/sousixth/Debt-Sniper.git)...
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo [!] Standard push had a conflict, retrying with force push...
    git push -u origin main --force
)

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [SUCCESS] Push to GitHub เรียบร้อยแล้ว! 🚀
    echo.
    echo   ให้เปิดเบราว์เซอร์แล้วกด Ctrl + F5 (หรือเปิดแบบไม่ใช้แคช):
    echo   👉 https://sousixth.github.io/Debt-Sniper/?v=2
    echo ========================================================
) else (
    echo ========================================================
    echo   [NOTICE] หากติดปัญหาการเข้าสู่ระบบ GitHub ในหน้าต่างนี้
    echo   กรุณากดยืนยันการ Sign in GitHub แล้วลองรันใหม่อีกครั้ง
    echo ========================================================
)
echo.
pause
