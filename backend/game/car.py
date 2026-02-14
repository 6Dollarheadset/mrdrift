"""
Car physics and drift mechanics for Mr. Drift
Implements arcade-style car physics with drift detection
"""

import pymunk
from pymunk import Vec2d
import math
from typing import Dict
from . import constants as C


class Car:
    """
    Represents a player's car with arcade-style physics and drift mechanics
    """

    def __init__(self, space: pymunk.Space, start_x: float, start_y: float):
        """
        Initialize car with physics body

        Args:
            space: Pymunk physics space
            start_x: Starting X position
            start_y: Starting Y position
        """
        self.space = space

        # Create physics body
        moment = pymunk.moment_for_box(C.CAR_MASS, (C.CAR_WIDTH, C.CAR_HEIGHT))
        self.body = pymunk.Body(C.CAR_MASS, moment)
        self.body.position = start_x, start_y

        # Create collision shape
        self.shape = pymunk.Poly.create_box(self.body, (C.CAR_WIDTH, C.CAR_HEIGHT))
        self.shape.friction = C.NORMAL_FRICTION

        # Add to physics space
        space.add(self.body, self.shape)

        # Drift state
        self.is_drifting = False
        self.drift_time = 0.0
        self.drift_score = 0
        self.combo_multiplier = 1.0
        self.time_since_last_drift = 0.0

        # Input state
        self.throttle = 0.0  # -.5 to 1
        self.steering = 0.0  # -1 to 1
        self.braking = 0.0   # 0 to 1

    def update(self, dt: float, inputs: Dict):
        """
        Update car physics based on player inputs

        Args:
            dt: Delta time in seconds
            inputs: Dictionary with 'throttle', 'steering', 'braking'
        """
        # Update input state
        self.throttle = inputs.get('throttle', 0.0)
        self.steering = inputs.get('steering', 0.0)
        self.braking = inputs.get('braking', 0.0)

        # Apply physics
        self._apply_acceleration(dt)
        self._apply_steering(dt)
        self._update_drift_state(dt)
        self._apply_friction(dt)
        self._limit_speed()
        # Apply grip AFTER other forces to align velocity with heading
        self._align_velocity_to_heading(dt)

        # Update scoring
        self._update_drift_score(dt)

    def _apply_acceleration(self, dt: float):
        """Apply throttle or brake force"""
        # Force in LOCAL coordinates (relative to car's orientation)
        # apply_force_at_local_point expects local coords, so no rotation needed
        # Positive X in local space is forward, negative X is backward

        if self.throttle > 0:
            # Acceleration - forward in local space
            force = Vec2d(C.ACCELERATION * self.throttle * C.CAR_MASS, 0)
            self.body.apply_force_at_local_point(force, (0, 0))
        elif self.throttle < 0:
            # Reverse - backward in local space
            force = Vec2d(C.REVERSE_SPEED * self.throttle * C.CAR_MASS, 0)
            self.body.apply_force_at_local_point(force, (0, 0))

    def _apply_steering(self, dt: float):
        """Apply steering to rotate the car"""
        if abs(self.steering) > 0.01:
            # Get current speed for speed-based steering
            speed = self.body.velocity.length

            # Better low-speed steering - allow steering even when slow
            # but make it more responsive at higher speeds
            if speed < 50:
                # Very low speed - minimal steering
                speed_factor = 0.3
            elif speed < 150:
                # Low to medium speed - linear increase
                speed_factor = 0.3 + (speed - 50) / 100.0 * 0.5
            else:
                # Higher speed - full steering
                speed_factor = min(0.8 + (speed - 150) / 300.0, 1.0)

            # Apply angular velocity
            turn_rate = C.TURN_SPEED * self.steering * speed_factor
            self.body.angular_velocity = turn_rate
        else:
            # Dampen rotation when not steering
            self.body.angular_velocity *= 0.8

    def _align_velocity_to_heading(self, dt: float):
        """
        Align velocity with car's heading direction (arcade-style grip)
        This makes the car feel "locked" to the direction it's facing
        """
        if self.body.velocity.length < 10:
            return  # Don't apply at very low speeds

        # Get forward direction (negate angle to match canvas rotation)
        forward = Vec2d(1, 0).rotated(-self.body.angle)

        # Get current velocity
        velocity = self.body.velocity

        # Calculate how much velocity is in forward vs sideways direction
        forward_speed = velocity.dot(forward)

        # Sideways vector (perpendicular to forward)
        right = Vec2d(0, 1).rotated(-self.body.angle)
        sideways_speed = velocity.dot(right)

        # Apply grip - reduce sideways velocity significantly when not drifting
        if not self.is_drifting:
            # Moderate grip - align velocity to heading
            grip_factor = 0.5  # How much to reduce sideways velocity (reduced from 0.85)

            # Calculate new velocity: keep forward speed, reduce sideways
            new_velocity = forward * forward_speed + right * sideways_speed * (1.0 - grip_factor)

            # Smoothly transition to new velocity
            self.body.velocity = velocity.interpolate_to(new_velocity, 0.15)
        else:
            # During drift, allow more sideways motion but still some grip
            drift_grip_factor = 0.2
            new_velocity = forward * forward_speed + right * sideways_speed * (1.0 - drift_grip_factor)
            self.body.velocity = velocity.interpolate_to(new_velocity, 0.08)

    def _update_drift_state(self, dt: float):
        """Detect and update drift state"""
        # Drift is triggered by braking while turning at speed
        speed = self.body.velocity.length
        is_turning = abs(self.steering) > 0.2
        is_braking = self.braking > C.DRIFT_THRESHOLD
        has_speed = speed > 200  # Minimum speed to drift

        # Check if we should be drifting
        should_drift = is_braking and is_turning and has_speed

        if should_drift and not self.is_drifting:
            # Start drifting
            self.is_drifting = True
            self.shape.friction = C.DRIFT_FRICTION
            self.drift_time = 0.0

        elif not should_drift and self.is_drifting:
            # End drifting - apply boost
            self.is_drifting = False
            self.shape.friction = C.NORMAL_FRICTION

            # Small speed boost on drift exit
            if self.drift_time > 0.5:  # Only if drift was sustained
                forward = Vec2d(1, 0).rotated(-self.body.angle)
                self.body.velocity += forward * 50

        # Update drift timer
        if self.is_drifting:
            self.drift_time += dt

        # Update combo decay
        if not self.is_drifting:
            self.time_since_last_drift += dt
            if self.time_since_last_drift > C.COMBO_DECAY_TIME:
                self.combo_multiplier = 1.0

    def _apply_friction(self, dt: float):
        """Apply friction/drag to simulate rolling resistance"""
        # Linear damping (air resistance)
        self.body.velocity *= 0.98

        # Additional braking force
        if self.braking > 0 and not self.is_drifting:
            brake_force = self.body.velocity.normalized() * (-C.BRAKE_FORCE * self.braking * C.CAR_MASS)
            self.body.apply_force_at_local_point(brake_force, (0, 0))

    def _limit_speed(self):
        """Cap maximum speed"""
        speed = self.body.velocity.length
        if speed > C.MAX_SPEED:
            self.body.velocity = self.body.velocity.normalized() * C.MAX_SPEED

    def _update_drift_score(self, dt: float):
        """Calculate drift score based on drift time and angle"""
        if self.is_drifting:
            # Reset combo timer
            self.time_since_last_drift = 0.0

            # Calculate drift angle (angle between velocity and car facing)
            if self.body.velocity.length > 10:
                velocity_angle = self.body.velocity.angle
                car_angle = self.body.angle
                drift_angle = abs(velocity_angle - car_angle)

                # Normalize to 0-180 degrees
                if drift_angle > math.pi:
                    drift_angle = 2 * math.pi - drift_angle

                # Angle bonus (higher score for bigger slides)
                angle_bonus = (drift_angle / math.pi) * C.DRIFT_ANGLE_MULTIPLIER

                # Increase combo multiplier
                self.combo_multiplier = min(self.combo_multiplier + dt * 0.5, 5.0)

                # Add to score
                points = (C.DRIFT_SCORE_PER_SECOND * dt *
                         (1 + angle_bonus) * self.combo_multiplier)
                self.drift_score += int(points)

    def respawn(self, x: float, y: float, angle: float = 0):
        """
        Respawn car at given position

        Args:
            x: X position
            y: Y position
            angle: Rotation angle in radians
        """
        self.body.position = x, y
        self.body.velocity = Vec2d(0, 0)
        self.body.angular_velocity = 0
        self.body.angle = angle
        self.is_drifting = False
        self.drift_time = 0.0

    def get_state(self) -> Dict:
        """
        Get car state for network transmission

        Returns:
            Dictionary containing car state
        """
        return {
            'x': float(self.body.position.x),
            'y': float(self.body.position.y),
            'angle': float(self.body.angle),
            'velocity_x': float(self.body.velocity.x),
            'velocity_y': float(self.body.velocity.y),
            'speed': float(self.body.velocity.length),
            'is_drifting': self.is_drifting,
            'drift_time': round(self.drift_time, 2),
            'drift_score': self.drift_score,
            'combo_multiplier': round(self.combo_multiplier, 1)
        }
