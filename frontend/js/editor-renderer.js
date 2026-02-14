/**
 * EditorRenderer - Canvas rendering for track editor
 */

class EditorRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size to world size
        this.canvas.width = 2000;
        this.canvas.height = 1500;

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0
        };

        // Grid settings
        this.gridSize = 50;
        this.showGrid = true;
    }

    render(editorState) {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Apply camera transform
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Draw boundaries
        this.drawBoundaries(editorState.outerPoints, '#00ff88', editorState.tool === 'outer');
        this.drawBoundaries(editorState.innerPoints, '#00aaff', editorState.tool === 'inner');

        // Draw spawn point
        if (editorState.spawnPoint) {
            this.drawSpawnPoint(editorState.spawnPoint);
        }

        // Draw finish line
        if (editorState.finishLine) {
            this.drawFinishLine(editorState.finishLine);
        }

        // Draw hover point
        if (editorState.hoverPoint) {
            this.drawHoverPoint(editorState.hoverPoint);
        }

        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawBoundaries(points, color, isActive) {
        if (!points || points.length === 0) return;

        // Draw lines
        this.ctx.strokeStyle = isActive ? color : `${color}88`;
        this.ctx.lineWidth = isActive ? 4 : 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();

        // Draw points
        points.forEach((point, index) => {
            this.ctx.fillStyle = isActive ? color : `${color}88`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw point number
            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(index + 1, point.x, point.y);
        });
    }

    drawSpawnPoint(spawn) {
        // Draw spawn position
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.arc(spawn.x, spawn.y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw direction arrow
        const arrowLength = 40;
        const endX = spawn.x + Math.cos(spawn.angle) * arrowLength;
        const endY = spawn.y + Math.sin(spawn.angle) * arrowLength;

        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(spawn.x, spawn.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Arrow head
        const headLength = 10;
        const angle1 = spawn.angle - Math.PI / 6;
        const angle2 = spawn.angle + Math.PI / 6;

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - headLength * Math.cos(angle1), endY - headLength * Math.sin(angle1));
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - headLength * Math.cos(angle2), endY - headLength * Math.sin(angle2));
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('START', spawn.x, spawn.y - 25);
    }

    drawFinishLine(finish) {
        // Checkered pattern
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(finish.start.x, finish.start.y);
        this.ctx.lineTo(finish.end.x, finish.end.y);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 6;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(finish.start.x, finish.start.y);
        this.ctx.lineTo(finish.end.x, finish.end.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // End points
        [finish.start, finish.end].forEach(point => {
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Label
        const midX = (finish.start.x + finish.end.x) / 2;
        const midY = (finish.start.y + finish.end.y) / 2;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FINISH', midX, midY - 15);
    }

    drawHoverPoint(point) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((screenX - rect.left) / rect.width) * this.canvas.width;
        const y = ((screenY - rect.top) / rect.height) * this.canvas.height;
        return { x: x + this.camera.x, y: y + this.camera.y };
    }

    snapToGrid(x, y) {
        return {
            x: Math.round(x / this.gridSize) * this.gridSize,
            y: Math.round(y / this.gridSize) * this.gridSize
        };
    }
}
