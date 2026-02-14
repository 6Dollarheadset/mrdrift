"""
Track definitions and boundary management for Mr. Drift
"""

import pymunk
import json
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from . import constants as C


class Track:
    """
    Represents a race track with boundaries and spawn points
    """

    def __init__(self, space: pymunk.Space, track_id: str, custom_track_data: Optional[Dict] = None):
        """
        Initialize track

        Args:
            space: Pymunk physics space
            track_id: Track identifier ('oval', 'technical', or custom track ID)
            custom_track_data: Optional custom track data dict (for custom tracks)
        """
        self.space = space
        self.track_id = track_id
        self.boundaries = []
        self.spawn_point = (500, 500, 0)  # Default spawn (x, y, angle)
        self.finish_line = None  # Optional finish line
        self.is_custom = custom_track_data is not None

        # Build the appropriate track
        if custom_track_data:
            self._build_from_json(custom_track_data)
        elif track_id == 'oval':
            self._build_oval_track()
        elif track_id == 'technical':
            self._build_technical_track()
        else:
            self._build_oval_track()  # Default

    def _add_boundary_segment(self, start: Tuple[float, float], end: Tuple[float, float]):
        """
        Add a static boundary segment to the track

        Args:
            start: (x, y) start position
            end: (x, y) end position
        """
        # Create static body for boundary
        body = pymunk.Body(body_type=pymunk.Body.STATIC)

        # Create segment shape
        segment = pymunk.Segment(body, start, end, 5)  # 5px thick
        segment.friction = C.TRACK_BOUNDARY_FRICTION
        segment.elasticity = 0.5  # Some bounce

        self.space.add(body, segment)
        self.boundaries.append({'start': start, 'end': end})

    def _build_oval_track(self):
        """
        Build a simple oval track - great for learning drift basics
        """
        # Track dimensions
        center_x = 1000
        center_y = 750
        width = 800
        height = 600
        track_width = 200

        # Outer boundaries (rectangle with rounded corners)
        # Top wall
        self._add_boundary_segment(
            (center_x - width/2, center_y - height/2),
            (center_x + width/2, center_y - height/2)
        )
        # Bottom wall
        self._add_boundary_segment(
            (center_x - width/2, center_y + height/2),
            (center_x + width/2, center_y + height/2)
        )
        # Left wall
        self._add_boundary_segment(
            (center_x - width/2, center_y - height/2),
            (center_x - width/2, center_y + height/2)
        )
        # Right wall
        self._add_boundary_segment(
            (center_x + width/2, center_y - height/2),
            (center_x + width/2, center_y + height/2)
        )

        # Inner boundaries (smaller rectangle)
        inner_width = width - track_width * 2
        inner_height = height - track_width * 2

        # Top inner wall
        self._add_boundary_segment(
            (center_x - inner_width/2, center_y - inner_height/2),
            (center_x + inner_width/2, center_y - inner_height/2)
        )
        # Bottom inner wall
        self._add_boundary_segment(
            (center_x - inner_width/2, center_y + inner_height/2),
            (center_x + inner_width/2, center_y + inner_height/2)
        )
        # Left inner wall
        self._add_boundary_segment(
            (center_x - inner_width/2, center_y - inner_height/2),
            (center_x - inner_width/2, center_y + inner_height/2)
        )
        # Right inner wall
        self._add_boundary_segment(
            (center_x + inner_width/2, center_y - inner_height/2),
            (center_x + inner_width/2, center_y + inner_height/2)
        )

        # Set spawn point (bottom center of track)
        self.spawn_point = (center_x - 200, center_y, 0)

    def _build_technical_track(self):
        """
        Build a more technical track with hairpins - for advanced drifting
        """
        # This track has more corners and tighter turns
        points_outer = [
            (300, 300),
            (1500, 300),
            (1700, 500),
            (1700, 1000),
            (1500, 1200),
            (800, 1200),
            (600, 1000),
            (600, 700),
            (800, 500),
            (300, 500),
        ]

        points_inner = [
            (450, 450),
            (1400, 450),
            (1550, 600),
            (1550, 900),
            (1400, 1050),
            (850, 1050),
            (750, 900),
            (750, 700),
            (850, 600),
            (450, 600),
        ]

        # Create outer boundary loop
        for i in range(len(points_outer)):
            start = points_outer[i]
            end = points_outer[(i + 1) % len(points_outer)]
            self._add_boundary_segment(start, end)

        # Create inner boundary loop
        for i in range(len(points_inner)):
            start = points_inner[i]
            end = points_inner[(i + 1) % len(points_inner)]
            self._add_boundary_segment(start, end)

        # Set spawn point
        self.spawn_point = (700, 400, 0)

    def _build_from_json(self, track_data: Dict):
        """
        Build track from JSON data

        Args:
            track_data: Dictionary with track definition
        """
        # Load outer boundaries
        if 'outer_boundaries' in track_data:
            for segment in track_data['outer_boundaries']:
                if len(segment) == 2:
                    start = tuple(segment[0])
                    end = tuple(segment[1])
                    self._add_boundary_segment(start, end)

        # Load inner boundaries
        if 'inner_boundaries' in track_data:
            for segment in track_data['inner_boundaries']:
                if len(segment) == 2:
                    start = tuple(segment[0])
                    end = tuple(segment[1])
                    self._add_boundary_segment(start, end)

        # Load spawn point
        if 'spawn_point' in track_data:
            sp = track_data['spawn_point']
            self.spawn_point = (
                sp.get('x', 500),
                sp.get('y', 500),
                sp.get('angle', 0)
            )

        # Load finish line
        if 'finish_line' in track_data:
            fl = track_data['finish_line']
            self.finish_line = {
                'start': tuple(fl['start']),
                'end': tuple(fl['end'])
            }

    @classmethod
    def load_custom_track(cls, space: pymunk.Space, track_id: str) -> 'Track':
        """
        Load a custom track from JSON file

        Args:
            space: Pymunk physics space
            track_id: Track ID (filename without .json)

        Returns:
            Track instance

        Raises:
            FileNotFoundError: If track file doesn't exist
            ValueError: If track data is invalid
        """
        # Get path to custom tracks directory
        custom_tracks_dir = Path(__file__).parent.parent / 'custom_tracks'
        track_file = custom_tracks_dir / f'{track_id}.json'

        if not track_file.exists():
            raise FileNotFoundError(f'Custom track not found: {track_id}')

        # Load JSON data
        with open(track_file, 'r') as f:
            track_data = json.load(f)

        # Validate required fields
        if 'id' not in track_data:
            track_data['id'] = track_id

        return cls(space, track_id, custom_track_data=track_data)

    def get_spawn_point(self) -> Tuple[float, float, float]:
        """
        Get the spawn point coordinates

        Returns:
            Tuple of (x, y, angle)
        """
        return self.spawn_point

    def get_boundaries(self) -> List[Dict]:
        """
        Get all boundary segments for rendering

        Returns:
            List of boundary dictionaries with 'start' and 'end' keys
        """
        return self.boundaries

    def get_metadata(self) -> Dict:
        """
        Get track metadata

        Returns:
            Dictionary with track info
        """
        # Built-in tracks
        metadata = {
            'oval': {
                'name': 'Simple Oval',
                'difficulty': 'Easy',
                'description': 'Perfect for learning the basics of drifting',
                'is_custom': False
            },
            'technical': {
                'name': 'Technical Circuit',
                'difficulty': 'Medium',
                'description': 'Tight corners and hairpins test your drift control',
                'is_custom': False
            }
        }

        # If it's a custom track, try to load metadata from file
        if self.is_custom:
            try:
                custom_tracks_dir = Path(__file__).parent.parent / 'custom_tracks'
                track_file = custom_tracks_dir / f'{self.track_id}.json'
                if track_file.exists():
                    with open(track_file, 'r') as f:
                        track_data = json.load(f)
                        return {
                            'name': track_data.get('name', 'Custom Track'),
                            'difficulty': track_data.get('difficulty', 'Custom'),
                            'description': track_data.get('description', ''),
                            'author': track_data.get('author', 'Unknown'),
                            'is_custom': True
                        }
            except Exception:
                pass

        return metadata.get(self.track_id, {
            'name': 'Unknown Track',
            'difficulty': 'Unknown',
            'description': '',
            'is_custom': False
        })
