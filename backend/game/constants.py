"""
Game constants for Mr. Drift
Contains physics parameters, car specifications, and game settings
"""

# Physics settings
TICK_RATE = 60  # Server updates per second
WORLD_WIDTH = 2000  # World size in pixels
WORLD_HEIGHT = 1500

# Car specifications
CAR_WIDTH = 40
CAR_HEIGHT = 20
CAR_MASS = 1000  # kg

# Car physics parameters (tuned for arcade-style drifting)
MAX_SPEED = 900  # pixels per second
ACCELERATION = 500  # pixels per second squared
BRAKE_FORCE = 700
TURN_SPEED = 4.0  # radians per second (more responsive steering)
REVERSE_SPEED = 350

# Drift mechanics
DRIFT_THRESHOLD = 0.3  # Brake input threshold to trigger drift
NORMAL_FRICTION = 0.9  # Normal tire grip (0-1, higher = more grip)
DRIFT_FRICTION = 0.4  # Reduced friction during drift
DRIFT_BOOST = 1.2  # Speed multiplier during drift exit

# Scoring
DRIFT_SCORE_PER_SECOND = 100  # Base points per second of drifting
DRIFT_ANGLE_MULTIPLIER = 2.0  # Bonus for larger drift angles
COMBO_DECAY_TIME = 1.5  # Seconds before combo resets

# Track settings
TRACK_BOUNDARY_FRICTION = 0.3
RESPAWN_DELAY = 1.0  # Seconds
