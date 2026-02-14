# Mr. Drift - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Frontend (JavaScript)                     │  │
│  │                                                        │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ Input   │  │ Renderer │  │  Game    │            │  │
│  │  │ Handler │→ │ (Canvas) │← │  Client  │            │  │
│  │  └─────────┘  └──────────┘  └─────┬────┘            │  │
│  │                                    │                  │  │
│  └────────────────────────────────────┼──────────────────┘  │
└─────────────────────────────────────┼─────────────────────┘
                                      │ WebSocket
                                      │ (Real-time)
┌──────────────────────────────────┼─────────────────────────┐
│                 Server            ▼                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Backend (Python + FastAPI)                   │  │
│  │                                                       │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ FastAPI │→ │  Game    │→ │  Physics │           │  │
│  │  │   App   │  │  Engine  │  │ (Pymunk) │           │  │
│  │  └─────────┘  └─────┬────┘  └──────────┘           │  │
│  │                     │                                │  │
│  │                     ├→ Car Physics & Drift           │  │
│  │                     └→ Track System                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Data Flow

### Game Loop (60 FPS server-side)

```
1. Client Input
   ↓
2. Send via WebSocket → Server
   ↓
3. Server: Process Input
   ↓
4. Server: Update Physics (Pymunk)
   ↓
5. Server: Calculate Game State
   ↓
6. Server: Send State → Client via WebSocket
   ↓
7. Client: Render State (Canvas)
   ↓
8. Repeat
```

## Component Details

### Backend Components

#### `main.py` - FastAPI Server
- WebSocket endpoint `/ws`
- REST API for track info
- Static file serving for frontend
- Manages player sessions

#### `game/engine.py` - Game Engine
- Manages Pymunk physics space
- 60Hz game loop
- Processes player inputs
- Serializes game state
- Handles respawns

#### `game/car.py` - Car Physics
- Pymunk body and shape
- Arcade-style physics:
  - Acceleration/braking
  - Steering (speed-dependent)
  - Drift detection and state
- Drift scoring system
- Combo multiplier

#### `game/track.py` - Track System
- Static boundary segments
- Collision detection
- Multiple track layouts
- Spawn point management

#### `game/constants.py` - Game Constants
- Physics parameters
- Car specifications
- Drift mechanics tuning
- Scoring values

### Frontend Components

#### `js/main.js` - Entry Point
- Initializes game
- Loads track selection
- Manages game loop
- Updates UI elements

#### `js/game.js` - Game Client
- WebSocket connection management
- Message handling (init, update, etc.)
- Input transmission
- State management

#### `js/input.js` - Input Handler
- Keyboard event listeners
- Key state tracking
- Support for multiple key bindings
- Prevents key repeat

#### `js/renderer.js` - Canvas Renderer
- 2D canvas drawing
- Camera system (follows car)
- Renders:
  - Track boundaries
  - Car with rotation
  - Velocity vectors
  - Drift effects
- Screen-space effects

#### `css/style.css` - Styling
- Game UI layout
- HUD elements (speed, score, combo)
- Track selection menu
- Drift indicator animations
- Responsive design

## WebSocket Protocol

### Message Types

**Client → Server:**

```json
{
  "type": "input",
  "inputs": {
    "up": true/false,
    "down": true/false,
    "left": true/false,
    "right": true/false,
    "brake": true/false
  }
}
```

```json
{
  "type": "change_track",
  "track_id": "oval" | "technical"
}
```

```json
{
  "type": "reset"
}
```

**Server → Client:**

```json
{
  "type": "init" | "update" | "track_changed" | "reset",
  "state": {
    "car": {
      "x": float,
      "y": float,
      "angle": float,
      "speed": float,
      "is_drifting": boolean,
      "drift_score": int,
      "combo_multiplier": float
    },
    "track": {
      "id": string,
      "boundaries": [...],
      "metadata": {...}
    },
    "timestamp": float
  }
}
```

## Physics Details

### Drift Detection Algorithm

```python
should_drift = (
    is_braking AND
    is_turning AND
    speed > threshold
)
```

### Drift Scoring Formula

```python
points = (
    base_points_per_second *
    (1 + drift_angle_bonus) *
    combo_multiplier
)
```

Where:
- `drift_angle_bonus = (drift_angle / π) * angle_multiplier`
- `combo_multiplier` increases over time while drifting
- Combo resets after 1.5s without drifting

## Performance Characteristics

- **Server tick rate:** 60 Hz
- **Client render rate:** ~60 FPS (browser-dependent)
- **Input send rate:** 30 Hz
- **Network latency tolerance:** <100ms for good experience
- **Physics step:** 1/60s (16.67ms)

## Extension Points

### Adding New Tracks
1. Create method in `Track` class
2. Define boundaries using `_add_boundary_segment()`
3. Set spawn point
4. Update metadata
5. Add to API endpoint

### Adding New Game Modes
1. Extend `GameEngine` class
2. Add mode-specific logic
3. Update WebSocket protocol
4. Add UI in frontend

### Adding Multiplayer
1. Modify `GameEngine` to support multiple cars
2. Update WebSocket to broadcast to all players
3. Add player ID to messages
4. Render multiple cars in client

### Custom Physics Tuning
- Modify `constants.py`
- Adjust car mass, friction, speed
- Tweak drift threshold
- Change scoring parameters

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend Framework | FastAPI | Async web server, WebSocket |
| Physics Engine | Pymunk | 2D rigid body physics |
| Server Runtime | Uvicorn | ASGI server |
| Data Validation | Pydantic | Type-safe data models |
| Frontend Rendering | HTML5 Canvas | 2D graphics |
| Communication | WebSocket | Real-time bidirectional |
| Styling | CSS3 | UI and animations |

## Development Workflow

1. **Backend changes** - Auto-reload via uvicorn
2. **Frontend changes** - Refresh browser
3. **Constants tuning** - Restart server
4. **New tracks** - Restart server

## Deployment Considerations

For production deployment:
- Disable DEBUG mode in `config.py`
- Use production ASGI server (Uvicorn with workers)
- Add SSL/TLS for WSS (secure WebSocket)
- Implement session management
- Add rate limiting
- Consider horizontal scaling for multiplayer
- Add monitoring and logging
- Optimize physics constants for server load

## Future Architecture Improvements

1. **State interpolation** - Smoother client-side rendering
2. **Client-side prediction** - Reduce input latency
3. **Delta compression** - Reduce bandwidth
4. **Room system** - Multiplayer lobbies
5. **Database integration** - Persistent high scores
6. **Replay system** - Record and playback races
7. **Asset pipeline** - Sprite graphics instead of shapes

---

This architecture provides a solid foundation for a web-based real-time game while keeping the codebase simple and maintainable.
