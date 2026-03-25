@echo off
REM Script to bundle Python CLI with PyInstaller for Windows

echo Bundling Python CLI with PyInstaller...

REM Check if PyInstaller is installed
python -m pip show pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    echo PyInstaller not found. Installing...
    python -m pip install pyinstaller
)

REM Create output directory
if not exist "VideOCR-GLM-CLI\dist" mkdir "VideOCR-GLM-CLI\dist"

REM Bundle the CLI using the spec file
cd VideOCR-GLM-CLI
pyinstaller videocr_glm_cli.spec

REM Copy the executable to the dist directory
if exist "dist\videocr_glm_cli.exe" (
    echo Successfully bundled Python CLI
    echo Executable location: VideOCR-GLM-CLI\dist\videocr_glm_cli.exe
) else (
    echo Failed to bundle Python CLI
    exit /b 1
)

cd ..