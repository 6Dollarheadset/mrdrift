# Mr. Drift

A web-based 2D drift racing game with arcade-style physics. Master the art of drifting on multiple tracks and rack up high scores!

## Features

- **Arcade-style drift physics** - Easy to learn, fun to master
- **Multiple tracks** - Simple oval and technical circuit, plus custom track support
- **Visual track editor** - WYSIWYG track creation tool with mouse controls
- **Real-time gameplay** - Python backend with WebSocket communication (60Hz server tick rate)
- **Drift scoring system** - Score points based on drift time, angle, and combos
- **100% open source** - Built with FastAPI, Pymunk, and vanilla JavaScript

## Architecture

### Backend (Python)
- **FastAPI** - Modern async web framework
- **Pymunk** - 2D physics engine for car physics and collision detection
- **WebSocket** - Real-time server-client communication
- **60Hz game loop** - Server-authoritative physics simulation

### Frontend (JavaScript)
- **HTML5 Canvas** - 2D rendering
- **Vanilla JavaScript** - No framework dependencies
- **WebSocket client** - Real-time connection to game server
- **Smooth interpolation** - Client-side rendering for responsive gameplay

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mrdrift
```

2. Create and activate a virtual environment:
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Running the Game

1. Start the server:
```bash
cd backend
python main.py
```

2. Open your browser and navigate to:
```
http://localhost:8000
```

3. Select a track and start drifting!

## Controls

- **↑ / W** - Accelerate
- **↓ / S** - Reverse
- **← / A** - Steer left
- **→ / D** - Steer right
- **Space / Shift** - Brake/Drift

## How to Drift

1. Build up speed on a straightaway
2. Approach a corner
3. Press brake/drift while steering into the turn
4. Control your angle with steering inputs
5. Release brake to exit the drift with a speed boost
6. Chain drifts together for combo multipliers!

## Gameplay Tips

- **Drift angle matters** - Bigger angles = more points
- **Maintain drifts** - Longer drifts build combo multipliers
- **Combo timing** - You have 1.5 seconds between drifts to maintain your combo
- **Speed control** - Too fast and you'll hit the wall, too slow and you can't drift
- **Track mastery** - Learn the racing line for each track

## Track Editor

Create your own custom drift tracks with the built-in visual editor!

### Accessing the Editor

Navigate to `http://localhost:8000/track-editor` while the server is running.

### How to Use

1. **Place boundaries** - Click points to create track boundaries (outer and inner walls)
2. **Set spawn point** - Define where the car starts and its initial direction
3. **Add finish line** - Mark the lap completion line
4. **Edit points** - Drag points to adjust track shape, right-click to delete
5. **Save track** - Give your track a name and save it
6. **Play** - Load your custom track in the main game!

### Editor Controls

- **Left click** - Add point to current boundary
- **Drag** - Move existing points
- **Right click** - Delete point
- **Tool buttons** - Switch between outer boundary, inner boundary, spawn, and finish line
- **Grid snap** - Toggle grid snapping for precise alignment
- **Undo/Redo** - Fix mistakes easily
- **Clear** - Start fresh
- **Save** - Store track as JSON file

## Project Structure

```
mrdrift/
├── backend/
│   ├── main.py              # FastAPI server with track API
│   ├── config.py            # Server configuration
│   ├── requirements.txt     # Python dependencies
│   ├── custom_tracks/       # User-created tracks (JSON)
│   └── game/
│       ├── engine.py        # Game loop and state management
│       ├── car.py           # Car physics and drift mechanics
│       ├── track.py         # Track definitions and loader
│       └── constants.py     # Game constants
├── frontend/
│   ├── index.html           # Main game page
│   ├── track-editor.html    # Track editor page
│   ├── css/
│   │   ├── style.css        # Game styling
│   │   └── editor-style.css # Editor styling
│   └── js/
│       ├── main.js          # Game entry point
│       ├── game.js          # Game client
│       ├── renderer.js      # Game canvas rendering
│       ├── input.js         # Input handling
│       ├── track-editor.js  # Editor state management
│       ├── editor-renderer.js # Editor canvas rendering
│       └── editor-tools.js  # Editor mouse interactions
└── README.md
```

## Game Physics

The game uses **Pymunk** (a Python binding of Chipmunk2D) for physics simulation:

- **Car model** - Mass-based physics with position, velocity, and rotation
- **Drift detection** - Triggered when braking while turning at speed
- **Friction system** - Normal grip vs drift state (reduced friction)
- **Collision detection** - Track boundaries using static segments
- **Server-authoritative** - All physics calculated on server for consistency

## Adding New Tracks

### Option 1: Use the Track Editor (Recommended)

The easiest way to create tracks is using the visual track editor at `/track-editor`. See the Track Editor section above.

### Option 2: Code-Based Tracks

For built-in tracks, edit `backend/game/track.py`:

1. Create a new method in the `Track` class (e.g., `_build_custom_track()`)
2. Define boundary segments using `_add_boundary_segment()`
3. Set the spawn point
4. Update the track metadata in `get_metadata()`
5. Add the track to the API in `backend/main.py`

### Custom Track Format

Custom tracks are stored as JSON files in `backend/custom_tracks/`:

```json
{
  "name": "My Track",
  "outer_boundary": [[x1, y1], [x2, y2], ...],
  "inner_boundary": [[x1, y1], [x2, y2], ...],
  "spawn_point": {"x": 800, "y": 750, "angle": 0},
  "finish_line": {"start": [x1, y1], "end": [x2, y2]}
}
```

## Tuning Physics

Physics constants can be adjusted in `backend/game/constants.py`:

- **Car specs** - Speed, acceleration, turn rate
- **Drift mechanics** - Friction values, drift threshold
- **Scoring** - Points per second, angle multipliers

## Development

### Running in Development Mode

The server runs in debug mode by default. Changes to Python files will auto-reload.

### WebSocket Protocol

Messages sent between client and server are JSON:

**Client → Server:**
- `{type: 'input', inputs: {up, down, left, right, brake}}`
- `{type: 'change_track', track_id: 'oval'}`
- `{type: 'reset'}`

**Server → Client:**
- `{type: 'init', state: {...}}`
- `{type: 'update', state: {...}}`
- `{type: 'track_changed', state: {...}}`

## Contributing

This is an open source project! Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Ideas for contributions:
- New built-in tracks
- Multiplayer support
- Ghost car (race against your best time)
- Lap timing and leaderboards
- Power-ups and obstacles
- Mobile/touch controls
- Gamepad support
- Visual improvements (particle effects, skid marks, animated backgrounds)
- Sound effects and music
- Replay system
- AI opponents

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Technologies Used

- **Python 3.11+** - Backend language
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Pymunk** - 2D physics engine
- **WebSocket** - Real-time communication
- **HTML5 Canvas** - 2D rendering
- **JavaScript ES6+** - Frontend logic

## Credits

Built with open source technologies. Special thanks to:
- FastAPI team for the excellent web framework
- Pymunk/Chipmunk2D for the physics engine
- The Python and JavaScript communities

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Happy drifting! 🏎️💨
