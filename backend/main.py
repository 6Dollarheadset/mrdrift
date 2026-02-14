"""
Mr. Drift - FastAPI server with WebSocket game loop
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
from pathlib import Path
from datetime import datetime
import re

from game.engine import GameEngine
from game.track import Track
from game import constants as C
import config


# Initialize FastAPI app
app = FastAPI(title="Mr. Drift", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend)
frontend_path = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

# Custom tracks directory
custom_tracks_dir = Path(__file__).parent / "custom_tracks"
custom_tracks_dir.mkdir(exist_ok=True)


# Pydantic model for custom track data
class CustomTrackData(BaseModel):
    name: str
    difficulty: str
    description: str
    author: str = "Anonymous"
    outer_boundaries: list
    inner_boundaries: list
    spawn_point: dict
    finish_line: dict | None = None


@app.get("/")
async def root():
    """Serve the main game page"""
    return FileResponse(str(frontend_path / "index.html"))


@app.get("/track-editor")
async def track_editor():
    """Serve the track editor page"""
    return FileResponse(str(frontend_path / "track-editor.html"))


@app.get("/api/tracks")
async def get_tracks():
    """Get available tracks (built-in and custom)"""
    tracks = [
        {
            "id": "oval",
            "name": "Simple Oval",
            "difficulty": "Easy",
            "description": "Perfect for learning the basics of drifting",
            "is_custom": False
        },
        {
            "id": "technical",
            "name": "Technical Circuit",
            "difficulty": "Medium",
            "description": "Tight corners and hairpins test your drift control",
            "is_custom": False
        }
    ]

    # Add custom tracks
    for track_file in custom_tracks_dir.glob("*.json"):
        try:
            with open(track_file, 'r') as f:
                track_data = json.load(f)
                tracks.append({
                    "id": track_file.stem,
                    "name": track_data.get('name', 'Custom Track'),
                    "difficulty": track_data.get('difficulty', 'Custom'),
                    "description": track_data.get('description', ''),
                    "author": track_data.get('author', 'Unknown'),
                    "is_custom": True
                })
        except Exception:
            pass  # Skip invalid track files

    return {"tracks": tracks}


@app.get("/api/custom-tracks")
async def get_custom_tracks():
    """Get list of custom tracks"""
    tracks = []
    for track_file in custom_tracks_dir.glob("*.json"):
        try:
            with open(track_file, 'r') as f:
                track_data = json.load(f)
                tracks.append({
                    "id": track_file.stem,
                    "name": track_data.get('name', 'Custom Track'),
                    "difficulty": track_data.get('difficulty', 'Custom'),
                    "description": track_data.get('description', ''),
                    "author": track_data.get('author', 'Unknown'),
                    "created": track_data.get('created', '')
                })
        except Exception:
            pass

    return {"tracks": tracks}


@app.get("/api/custom-tracks/{track_id}")
async def get_custom_track(track_id: str):
    """Get specific custom track data"""
    track_file = custom_tracks_dir / f"{track_id}.json"

    if not track_file.exists():
        raise HTTPException(status_code=404, detail="Track not found")

    try:
        with open(track_file, 'r') as f:
            track_data = json.load(f)
        return track_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading track: {str(e)}")


@app.post("/api/custom-tracks")
async def save_custom_track(track: CustomTrackData):
    """Save a new custom track"""
    # Sanitize track name for filename
    sanitized_name = re.sub(r'[^a-z0-9_]', '', track.name.lower().replace(' ', '_'))
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    track_id = f"custom_{sanitized_name}_{timestamp}"

    # Create track data
    track_data = {
        "id": track_id,
        "name": track.name,
        "difficulty": track.difficulty,
        "description": track.description,
        "author": track.author,
        "created": datetime.now().isoformat(),
        "outer_boundaries": track.outer_boundaries,
        "inner_boundaries": track.inner_boundaries,
        "spawn_point": track.spawn_point,
        "finish_line": track.finish_line
    }

    # Save to file
    track_file = custom_tracks_dir / f"{track_id}.json"
    try:
        with open(track_file, 'w') as f:
            json.dump(track_data, f, indent=2)
        return {"success": True, "track_id": track_id, "message": "Track saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving track: {str(e)}")


@app.delete("/api/custom-tracks/{track_id}")
async def delete_custom_track(track_id: str):
    """Delete a custom track"""
    track_file = custom_tracks_dir / f"{track_id}.json"

    if not track_file.exists():
        raise HTTPException(status_code=404, detail="Track not found")

    try:
        track_file.unlink()
        return {"success": True, "message": "Track deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting track: {str(e)}")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time game updates
    Client connects here to play the game
    """
    print("WebSocket connection attempt...")
    await websocket.accept()
    print("WebSocket accepted")

    # Create game engine instance for this player
    print("Creating game engine...")
    game = GameEngine('oval')  # Default track
    print("Game engine created")

    try:
        # Send initial game state
        print("Getting initial state...")
        initial_state = game.get_state()
        print(f"Initial state: {initial_state}")
        print("Sending initial state to client...")
        await websocket.send_json({
            'type': 'init',
            'state': initial_state
        })
        print("Initial state sent")

        # Start game loop
        game.running = True
        print("Starting game loop...")

        # Create tasks for sending updates and receiving inputs
        async def send_updates():
            """Send game state updates to client at TICK_RATE"""
            print("send_updates task started")
            print(f"send_updates: game.running = {game.running}")
            try:
                update_count = 0
                while game.running:
                    if update_count == 0:
                        print("send_updates: entered while loop")

                    # Update game physics
                    game.update()

                    # Send state to client
                    state = game.get_state()

                    try:
                        await websocket.send_json({
                            'type': 'update',
                            'state': state
                        })
                    except Exception as e:
                        print(f"Error sending update: {e}")
                        raise

                    update_count += 1
                    if update_count == 1:
                        print(f"Sent first update successfully")
                    if update_count % 60 == 0:  # Log every second
                        print(f"Sent {update_count} updates")

                    # Wait for next tick
                    await asyncio.sleep(1.0 / C.TICK_RATE)

                print(f"send_updates exiting, game.running={game.running}")
            except Exception as e:
                print(f"Error in send_updates: {e}")
                import traceback
                traceback.print_exc()

        async def receive_inputs():
            """Receive player inputs from client"""
            print("receive_inputs task started")
            print(f"receive_inputs: game.running = {game.running}")
            try:
                while game.running:
                    print("receive_inputs: waiting for message...")
                    try:
                        # Receive message from client
                        data = await websocket.receive_text()
                        print(f"receive_inputs: got message: {data[:50]}")
                        message = json.loads(data)

                        # Process different message types
                        if message['type'] == 'input':
                            # Update player inputs
                            game.process_input(message['inputs'])

                        elif message['type'] == 'change_track':
                            # Change to different track
                            track_id = message.get('track_id', 'oval')
                            game.reset(track_id)

                            # Send new track state
                            await websocket.send_json({
                                'type': 'track_changed',
                                'state': game.get_state()
                            })

                        elif message['type'] == 'reset':
                            # Reset game
                            game.reset()

                            # Send reset confirmation
                            await websocket.send_json({
                                'type': 'reset',
                                'state': game.get_state()
                            })

                    except WebSocketDisconnect as e:
                        print(f"WebSocket disconnected in receive_inputs: {e}")
                        game.running = False
                        break
                    except json.JSONDecodeError:
                        # Invalid JSON, ignore
                        print("Invalid JSON received")
                        pass

                print(f"receive_inputs exiting, game.running={game.running}")
            except Exception as e:
                print(f"Error in receive_inputs outer: {e}")
                import traceback
                traceback.print_exc()

        # Run both tasks concurrently
        print("Starting asyncio.gather...")
        await asyncio.gather(
            send_updates(),
            receive_inputs()
        )
        print("asyncio.gather completed")

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        import traceback
        traceback.print_exc()
    finally:
        game.running = False


if __name__ == "__main__":
    import uvicorn
    print(f"🏎️  Starting Mr. Drift server on http://{config.HOST}:{config.PORT}")
    print(f"📡 WebSocket endpoint: ws://{config.HOST}:{config.PORT}/ws")
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info"
    )
