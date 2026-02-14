/**
 * Renderer for Mr. Drift
 * Handles all canvas drawing operations
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Camera position
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0
        };
    }

    resizeCanvas() {
        // Make canvas fill the window
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 40;
        const aspectRatio = 16 / 9;

        let width = maxWidth;
        let height = width / aspectRatio;

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
    }

    render(gameState) {
        if (!gameState || !gameState.car) return;

        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update camera to follow car
        this.updateCamera(gameState.car);

        // Save context
        this.ctx.save();

        // Apply camera transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw track
        this.drawTrack(gameState.track);

        // Draw car
        this.drawCar(gameState.car);

        // Restore context
        this.ctx.restore();

        // Draw drift effects (screen-space)
        if (gameState.car.is_drifting) {
            this.drawDriftEffect();
        }
    }

    updateCamera(car) {
        // Smoothly follow the car
        const targetX = car.x;
        const targetY = car.y;

        // Smooth camera movement (lerp)
        const smoothing = 0.1;
        this.camera.x += (targetX - this.camera.x) * smoothing;
        this.camera.y += (targetY - this.camera.y) * smoothing;

        // Zoom based on speed (optional)
        const targetZoom = Math.max(0.6, 1.0 - car.speed / 2000);
        this.camera.zoom += (targetZoom - this.camera.zoom) * smoothing;
    }

    drawTrack(track) {
        if (!track || !track.boundaries) return;

        // Draw track boundaries
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';

        track.boundaries.forEach(boundary => {
            this.ctx.beginPath();
            this.ctx.moveTo(boundary.start[0], boundary.start[1]);
            this.ctx.lineTo(boundary.end[0], boundary.end[1]);
            this.ctx.stroke();
        });

        // Draw track surface (fill area)
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
    }

    drawCar(car) {
        this.ctx.save();

        // Move to car position
        this.ctx.translate(car.x, car.y);
        this.ctx.rotate(car.angle);

        // Car dimensions
        const length = 40;
        const width = 20;

        // Main body color - bright red like Lightning McQueen
        const baseColor = car.is_drifting ? '#ff0000' : '#e30000';

        // Draw car body (sports car shape)
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();

        // Front (pointed nose)
        this.ctx.moveTo(length/2, 0);
        this.ctx.lineTo(length/2 - 5, -width/2 + 2);
        this.ctx.lineTo(length/2 - 5, width/2 - 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Main body
        this.ctx.fillStyle = baseColor;
        this.ctx.fillRect(-length/2, -width/2, length - 5, width);

        // Rear spoiler
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(-length/2 - 3, -width/2 - 2, 3, width + 4);

        // Windshield (lighter blue)
        this.ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
        this.ctx.fillRect(5, -6, 12, 12);

        // Side windows
        this.ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
        this.ctx.fillRect(-8, -7, 10, 3);
        this.ctx.fillRect(-8, 4, 10, 3);

        // Yellow/white stripes (racing stripes)
        this.ctx.fillStyle = car.is_drifting ? '#ffff00' : '#ffdd00';
        this.ctx.fillRect(-10, -1, 25, 2);

        // Headlights
        this.ctx.fillStyle = car.is_drifting ? '#ffff00' : '#ffffff';
        this.ctx.fillRect(length/2 - 8, -width/2 + 1, 3, 2);
        this.ctx.fillRect(length/2 - 8, width/2 - 3, 3, 2);

        // Wheels (black circles)
        this.ctx.fillStyle = '#1a1a1a';
        // Front left
        this.ctx.beginPath();
        this.ctx.arc(12, -width/2 - 1, 3, 0, Math.PI * 2);
        this.ctx.fill();
        // Front right
        this.ctx.beginPath();
        this.ctx.arc(12, width/2 + 1, 3, 0, Math.PI * 2);
        this.ctx.fill();
        // Rear left
        this.ctx.beginPath();
        this.ctx.arc(-12, -width/2 - 1, 3, 0, Math.PI * 2);
        this.ctx.fill();
        // Rear right
        this.ctx.beginPath();
        this.ctx.arc(-12, width/2 + 1, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw drift smoke effect
        if (car.is_drifting) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            // Smoke puffs behind rear wheels
            for (let i = 0; i < 3; i++) {
                const offset = -18 - (i * 8);
                const size = 6 - i;
                this.ctx.globalAlpha = 0.6 - (i * 0.2);
                // Left smoke
                this.ctx.beginPath();
                this.ctx.arc(offset, -width/2 - 2, size, 0, Math.PI * 2);
                this.ctx.fill();
                // Right smoke
                this.ctx.beginPath();
                this.ctx.arc(offset, width/2 + 2, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.restore();
    }

    drawDriftEffect() {
        // Screen vignette effect during drift
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.canvas.height * 0.3,
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.canvas.height * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0.15)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
