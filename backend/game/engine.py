"""
Game engine for Mr. Drift
Manages physics simulation, game state, and player updates
"""

import pymunk
import time
from typing import Dict, Optional
from .car import Car
from .track import Track
from . import constants as C


class GameEngine:
    """
    Main game engine managing physics and game state
    """

    def __init__(self, track_id: str = 'oval'):
        """
        Initialize game engine

        Args:
            track_id: ID of the track to load
        """
        # Create physics space
        self.space = pymunk.Space()
        self.space.gravity = (0, 0)  # Top-down game, no gravity

        # Load track (built-in or custom)
        if track_id.startswith('custom_'):
            # Load custom track
            try:
                self.track = Track.load_custom_track(self.space, track_id)
            except FileNotFoundError:
                # Fall back to oval if custom track not found
                print(f"Custom track {track_id} not found, using oval")
                self.track = Track(self.space, 'oval')
        else:
            # Load built-in track
            self.track = Track(self.space, track_id)

        # Create player car
        spawn_x, spawn_y, spawn_angle = self.track.get_spawn_point()
        self.car = Car(self.space, spawn_x, spawn_y)
        self.car.body.angle = spawn_angle

        # Game state
        self.running = False
        self.dt = 1.0 / C.TICK_RATE
        self.last_update = time.time()

        # Input state (updated by client)
        self.current_inputs = {
            'throttle': 0.0,
            'steering': 0.0,
            'braking': 0.0
        }

    def update(self):
        """
        Update game physics by one tick
        Should be called at TICK_RATE Hz
        """
        # Update car with current inputs
        self.car.update(self.dt, self.current_inputs)

        # Step physics simulation
        self.space.step(self.dt)

        # Check for collisions and handle respawn
        self._check_boundaries()

    def process_input(self, inputs: Dict):
        """
        Process player inputs

        Args:
            inputs: Dictionary with input state
                   Expected keys: 'up', 'down', 'left', 'right', 'brake'
        """
        # Convert keyboard inputs to car controls
        throttle = 0.0
        steering = 0.0
        braking = 0.0

        # Throttle control
        if inputs.get('up', False):
            throttle = 1.0
        elif inputs.get('down', False):
            throttle = -1.0

        # Steering control
        if inputs.get('left', False):
            steering = -1.0
        elif inputs.get('right', False):
            steering = 1.0

        # Brake/drift control
        if inputs.get('brake', False):
            braking = 1.0

        self.current_inputs = {
            'throttle': throttle,
            'steering': steering,
            'braking': braking
        }

    def _check_boundaries(self):
        """
        Check if car is out of bounds and respawn if needed
        """
        x, y = self.car.body.position

        # Check if way out of track bounds (simple check)
        if x < 0 or x > C.WORLD_WIDTH or y < 0 or y > C.WORLD_HEIGHT:
            spawn_x, spawn_y, spawn_angle = self.track.get_spawn_point()
            self.car.respawn(spawn_x, spawn_y, spawn_angle)

    def get_state(self) -> Dict:
        """
        Get complete game state for network transmission

        Returns:
            Dictionary containing all game state
        """
        return {
            'car': self.car.get_state(),
            'track': {
                'id': self.track.track_id,
                'boundaries': self.track.get_boundaries(),
                'metadata': self.track.get_metadata()
            },
            'timestamp': time.time()
        }

    def reset(self, track_id: Optional[str] = None):
        """
        Reset the game state

        Args:
            track_id: Optional new track ID to load
        """
        if track_id and track_id != self.track.track_id:
            # Load new track
            # Remove old car and track from space
            self.space.remove(self.car.body, self.car.shape)

            # Create new track
            self.track = Track(self.space, track_id)

            # Respawn car at new track's spawn point
            spawn_x, spawn_y, spawn_angle = self.track.get_spawn_point()
            self.car = Car(self.space, spawn_x, spawn_y)
            self.car.body.angle = spawn_angle
        else:
            # Just respawn car
            spawn_x, spawn_y, spawn_angle = self.track.get_spawn_point()
            self.car.respawn(spawn_x, spawn_y, spawn_angle)
            self.car.drift_score = 0
            self.car.combo_multiplier = 1.0
