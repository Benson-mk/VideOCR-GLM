@echo off
REM Comprehensive build script for VideOCR-GLM Electron app

echo ========================================
echo Building VideOCR-GLM Electron App
echo ========================================
echo.

REM Clean up any previous build artifacts and processes
echo [0/4] Cleaning up previous build...
call scripts\clean-build.bat
echo.

REM Step 1: Build Frontend
echo [1/4] Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    exit /b 1
)
echo Frontend build completed successfully
echo.

REM Step 2: Build Backend
echo [2/4] Building Backend...
call npm run build:backend
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    exit /b 1
)
echo Backend build completed successfully
echo.

REM Step 3: Bundle Python CLI
echo [3/4] Bundling Python CLI...
call scripts\bundle-python-cli.bat
if %errorlevel% neq 0 (
    echo WARNING: Python CLI bundling failed or skipped
    echo The app will still work but requires Python to be installed
) else (
    echo Python CLI bundled successfully
)
echo.

REM Step 4: Build Electron App
echo [4/4] Building Electron App...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run build:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    exit /b 1
)
echo Electron build completed successfully
echo.

echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Output files are in: dist-electron\
echo.
echo You can now distribute the installer:
echo - NSIS Installer: dist-electron\VideOCR-GLM Setup X.X.X.exe
echo.