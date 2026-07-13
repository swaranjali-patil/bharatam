@echo off
echo ================================================
echo   Bhartam E-Learning Setup Checker
echo ================================================
echo.

:: Check Node.js
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed!
    echo    Please install from: https://nodejs.org/
    goto :end
) else (
    node --version
    echo ✅ Node.js is installed
)
echo.

:: Check npm
echo [2/6] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm is not available!
    goto :end
) else (
    npm --version
    echo ✅ npm is available
)
echo.

:: Check if node_modules exists
echo [3/6] Checking frontend dependencies...
if exist "node_modules\" (
    echo ✅ Frontend dependencies are installed
) else (
    echo ⚠️  WARNING: Frontend node_modules not found
    echo    Run: npm install
)
echo.

:: Check if server/node_modules exists
echo [4/6] Checking backend dependencies...
if exist "server\node_modules\" (
    echo ✅ Backend dependencies are installed
) else (
    echo ⚠️  WARNING: Backend node_modules not found
    echo    Run: cd server ^&^& npm install
)
echo.

:: Check .env file
echo [5/6] Checking environment configuration...
if exist ".env" (
    echo ✅ .env file exists
    findstr /C:"VITE_BUNNY_STORAGE_ZONE" .env >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  WARNING: VITE_BUNNY_STORAGE_ZONE not found in .env
    ) else (
        echo ✅ Bunny Storage Zone configured
    )
    findstr /C:"VITE_BUNNY_VIDEO_LIBRARY_ID" .env >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  WARNING: VITE_BUNNY_VIDEO_LIBRARY_ID not found in .env
    ) else (
        echo ✅ Bunny Video Library configured
    )
) else (
    echo ❌ ERROR: .env file not found!
    echo    Please create .env file with Bunny.net credentials
)
echo.

:: Check Firebase CLI
echo [6/6] Checking Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: Firebase CLI not installed
    echo    Install with: npm install -g firebase-tools
    echo    (Required for deploying Firestore rules)
) else (
    firebase --version
    echo ✅ Firebase CLI is installed
)
echo.

:: Check firestore.rules
if exist "firestore.rules" (
    echo ✅ firestore.rules file exists
) else (
    echo ❌ ERROR: firestore.rules file not found!
    echo    This file is required for fixing permissions
)
echo.

:: Summary
echo ================================================
echo   Setup Summary
echo ================================================
echo.
echo Next Steps:
echo.
echo 1. If any dependencies are missing, install them:
echo    Frontend: npm install
echo    Backend:  cd server ^&^& npm install
echo.
echo 2. Deploy Firestore rules to fix permissions:
echo    Run: deploy-firestore-rules.bat
echo    OR:  firebase deploy --only firestore:rules
echo.
echo 3. Start the servers:
echo    Terminal 1: cd server ^&^& node index.js
echo    Terminal 2: npm run dev
echo.
echo 4. Make sure your user has the correct role in Firestore:
echo    - Go to Firebase Console
echo    - Find your user in bharatam_users collection
echo    - Add field: role = "trainer" (or "superadmin")
echo.
echo Read FIX_PERMISSIONS_ERROR.md for detailed instructions!
echo.

:end
pause
