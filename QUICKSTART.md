# Quick Start Guide

Get Mr. Drift running in 3 easy steps!

## Prerequisites

Make sure you have **Python 3.11 or higher** installed:
- Download from [python.org/downloads](https://www.python.org/downloads/)
- During installation, check "Add Python to PATH"

Verify installation:
```bash
python --version
# or
python3 --version
```

## Installation & Running

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

Then run:
```bash
cd backend
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

python main.py
```

### Option 2: Manual Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
```

2. **Activate virtual environment:**
```bash
# Windows (Git Bash):
source venv/Scripts/activate

# Windows (CMD):
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run the server:**
```bash
python main.py
```

## Play the Game

1. Open your browser
2. Go to: `http://localhost:8000`
3. Select a track
4. Start drifting!

## Controls

- **↑** or **W** - Accelerate
- **↓** or **S** - Reverse
- **←** or **A** - Steer Left
- **→** or **D** - Steer Right
- **Space** or **Shift** - Brake/Drift

## Tips for Maximum Drift Points

1. **Build speed** on straightaways
2. **Brake + Turn** to initiate drift
3. **Hold the drift** for longer combos
4. **Exit cleanly** for speed boost
5. **Chain drifts** within 1.5 seconds to keep combo

## Troubleshooting

### Python not found
- Make sure Python 3.11+ is installed
- Verify it's added to PATH
- Try `python3` instead of `python`

### Port 8000 already in use
- Change the port in `backend/config.py`
- Or stop other services using port 8000

### WebSocket connection failed
- Make sure the server is running
- Check console for error messages
- Try refreshing the browser

### Game is laggy
- Close other browser tabs
- Update your browser
- Check if your computer meets minimum requirements

## What's Next?

- Try both tracks (Oval and Technical)
- Beat your high score
- Modify physics in `backend/game/constants.py`
- Create custom tracks in `backend/game/track.py`
- Read the full [README.md](README.md) for development info

---

**Have fun and happy drifting!** 🏎️💨
