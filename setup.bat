@echo off
REM Setup script for Mr. Drift (Windows)

echo 🏎️  Setting up Mr. Drift...

cd backend

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed. Please install Python 3.11 or higher.
    echo    Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Using Python:
python --version

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment and install dependencies
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo ✅ Setup complete!
echo.
echo To run the game:
echo 1. Activate the virtual environment:
echo    cd backend ^&^& venv\Scripts\activate
echo 2. Start the server:
echo    python main.py
echo 3. Open http://localhost:8000 in your browser
echo.
echo Happy drifting! 🏎️💨
echo.
pause
