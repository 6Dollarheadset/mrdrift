/**
 * Input handler for Mr. Drift
 * Manages keyboard input state
 */

class InputHandler {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            brake: false
        };

        this.keysPressed = new Set();

        // Bind event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Key down
        window.addEventListener('keydown', (e) => {
            // Prevent default for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            this.handleKeyDown(e.key);
        });

        // Key up
        window.addEventListener('keyup', (e) => {
            this.handleKeyUp(e.key);
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleKeyDown(key) {
        // Avoid key repeat
        if (this.keysPressed.has(key)) {
            return;
        }
        this.keysPressed.add(key);

        switch(key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.down = true;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = true;
                break;
            case ' ':
            case 'Shift':
                this.keys.brake = true;
                break;
        }
    }

    handleKeyUp(key) {
        this.keysPressed.delete(key);

        switch(key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.down = false;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = false;
                break;
            case ' ':
            case 'Shift':
                this.keys.brake = false;
                break;
        }
    }

    getState() {
        return { ...this.keys };
    }

    reset() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            brake: false
        };
        this.keysPressed.clear();
    }
}
