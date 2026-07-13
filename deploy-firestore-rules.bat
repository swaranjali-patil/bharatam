@echo off
echo ================================================
echo   Deploying Firestore Rules to Firebase
echo ================================================
echo.

echo Checking if Firebase CLI is installed...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Firebase CLI is not installed!
    echo.
    echo Please install it first with:
    echo npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo.
echo Firebase CLI found!
echo.
echo Logging in to Firebase...
firebase login

echo.
echo Deploying Firestore security rules...
firebase deploy --only firestore:rules

echo.
echo ================================================
echo   Deployment Complete!
echo ================================================
echo.
echo Your Firestore security rules have been updated.
echo You can now create courses and upload videos!
echo.
echo Next steps:
echo 1. Start backend server: cd server ^&^& node index.js
echo 2. Start frontend: npm run dev
echo 3. Login and try creating a course
echo.
pause
