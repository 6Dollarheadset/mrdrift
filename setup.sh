#!/bin/bash
# Setup script for Mr. Drift

echo "🏎️  Setting up Mr. Drift..."

# Navigate to backend directory
cd backend

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null
then
    echo "❌ Python is not installed. Please install Python 3.11 or higher."
    echo "   Download from: https://www.python.org/downloads/"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "Using Python: $PYTHON_CMD"

# Create virtual environment
echo "Creating virtual environment..."
$PYTHON_CMD -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the game:"
echo "1. Activate the virtual environment:"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "   cd backend && source venv/Scripts/activate"
else
    echo "   cd backend && source venv/bin/activate"
fi
echo "2. Start the server:"
echo "   python main.py"
echo "3. Open http://localhost:8000 in your browser"
echo ""
echo "Happy drifting! 🏎️💨"
