@echo off
REM Cleanup script to remove build artifacts and kill running processes

echo ========================================
echo Cleaning Build Artifacts
echo ========================================
echo.

REM Kill any running Electron or VideOCR processes
echo [1/3] Stopping running processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM VideOCR-GLM.exe 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul
echo Processes stopped
echo.

REM Wait a moment for processes to fully terminate
echo [2/3] Waiting for processes to terminate...
timeout /t 2 /nobreak >nul
echo Done
echo.

REM Remove build directories
echo [3/4] Removing build directories...
if exist "dist-electron" (
    echo Removing dist-electron...
    rmdir /s /q dist-electron
)
if exist "frontend\dist" (
    echo Removing frontend\dist...
    rmdir /s /q frontend\dist
)
if exist "backend\dist" (
    echo Removing backend\dist...
    rmdir /s /q backend\dist
)
if exist "VideOCR-GLM-CLI\dist" (
    echo Removing VideOCR-GLM-CLI\dist...
    rmdir /s /q VideOCR-GLM-CLI\dist
)
if exist "VideOCR-GLM-CLI\build" (
    echo Removing VideOCR-GLM-CLI\build...
    rmdir /s /q VideOCR-GLM-CLI\build
)
echo Cleanup completed
echo.

REM Clear electron-builder cache to prevent code signing tool download
echo [4/4] Clearing electron-builder cache...
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
    echo Removing winCodeSign cache...
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
)
echo Cache cleared
echo.

echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo You can now run the build script:
echo   scripts\build-electron.bat
echo.