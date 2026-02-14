/**
 * EditorTools - Handle mouse interactions and tool behavior
 */

class EditorTools {
    constructor(canvas, renderer, updateCallback) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.updateCallback = updateCallback;

        this.draggingPoint = null;
        this.draggingSpawn = false;
        this.finishLineFirstPoint = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    }

    handleClick(e) {
        if (this.draggingPoint || this.draggingSpawn) return;

        const pos = this.renderer.screenToWorld(e.clientX, e.clientY);
        const snapped = this.snapIfEnabled(pos);

        const state = this.updateCallback('getState');

        if (state.tool === 'outer') {
            this.updateCallback('addOuterPoint', snapped);
        } else if (state.tool === 'inner') {
            this.updateCallback('addInnerPoint', snapped);
        } else if (state.tool === 'spawn') {
            this.updateCallback('setSpawnPoint', { x: snapped.x, y: snapped.y, angle: 0 });
        } else if (state.tool === 'finish') {
            if (!this.finishLineFirstPoint) {
                this.finishLineFirstPoint = snapped;
            } else {
                this.updateCallback('setFinishLine', {
                    start: this.finishLineFirstPoint,
                    end: snapped
                });
                this.finishLineFirstPoint = null;
            }
        }
    }

    handleMouseMove(e) {
        const pos = this.renderer.screenToWorld(e.clientX, e.clientY);
        const snapped = this.snapIfEnabled(pos);

        // Update mouse coordinates display
        const coordsDisplay = document.getElementById('mouse-coords');
        if (coordsDisplay) {
            coordsDisplay.textContent = `X: ${Math.round(snapped.x)}, Y: ${Math.round(snapped.y)}`;
        }

        // Handle dragging
        if (this.draggingPoint) {
            this.draggingPoint.x = snapped.x;
            this.draggingPoint.y = snapped.y;
            this.updateCallback('render');
        } else if (this.draggingSpawn) {
            const state = this.updateCallback('getState');
            if (state.spawnPoint) {
                const dx = snapped.x - state.spawnPoint.x;
                const dy = snapped.y - state.spawnPoint.y;
                const angle = Math.atan2(dy, dx);
                state.spawnPoint.angle = angle;
                this.updateCallback('render');
            }
        } else {
            // Check for hover on points
            const hoverPoint = this.findPointNear(snapped);
            this.updateCallback('setHoverPoint', hoverPoint);
        }
    }

    handleMouseDown(e) {
        const pos = this.renderer.screenToWorld(e.clientX, e.clientY);
        const snapped = this.snapIfEnabled(pos);

        // Check if clicking on spawn point
        const state = this.updateCallback('getState');
        if (state.spawnPoint) {
            const dist = Math.hypot(snapped.x - state.spawnPoint.x, snapped.y - state.spawnPoint.y);
            if (dist < 20) {
                this.draggingSpawn = true;
                return;
            }
        }

        // Check if clicking on existing point
        const point = this.findPointNear(snapped);
        if (point) {
            this.draggingPoint = point;
        }
    }

    handleMouseUp(e) {
        this.draggingPoint = null;
        this.draggingSpawn = false;
    }

    handleRightClick(e) {
        e.preventDefault();

        const pos = this.renderer.screenToWorld(e.clientX, e.clientY);
        const point = this.findPointNear(pos);

        if (point) {
            this.updateCallback('deletePoint', point);
        }
    }

    findPointNear(pos, threshold = 15) {
        const state = this.updateCallback('getState');

        // Check outer points
        for (const point of state.outerPoints) {
            const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
            if (dist < threshold) return point;
        }

        // Check inner points
        for (const point of state.innerPoints) {
            const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
            if (dist < threshold) return point;
        }

        return null;
    }

    snapIfEnabled(pos) {
        const snapEnabled = document.getElementById('snap-to-grid')?.checked;
        if (snapEnabled) {
            return this.renderer.snapToGrid(pos.x, pos.y);
        }
        return pos;
    }
}
