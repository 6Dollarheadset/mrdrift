/**
 * Main entry point for Mr. Drift
 * Initializes and runs the game
 */

// Game components
let gameClient;
let renderer;
let animationFrameId;

// UI elements
const canvas = document.getElementById('gameCanvas');
const trackSelectMenu = document.getElementById('track-select-menu');
const trackList = document.getElementById('track-list');
const loadingText = document.getElementById('loading');
const connectionStatus = document.getElementById('connection-status');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const driftIndicator = document.getElementById('drift-indicator');
const speedValue = document.getElementById('speed-value');
const driftScore = document.getElementById('drift-score');
const comboValue = document.getElementById('combo-value');

// WebSocket URL
const wsUrl = `ws://${window.location.host}/ws`;

// Initialize game
async function init() {
    console.log('Initializing Mr. Drift...');

    // Create renderer
    renderer = new Renderer(canvas);

    // Load available tracks
    await loadTracks();

    // Create game client (but don't connect yet)
    gameClient = new GameClient(wsUrl);

    // Set up callbacks
    gameClient.onStateUpdate = (state) => {
        updateUI(state);
    };

    gameClient.onConnectionChange = (connected) => {
        updateConnectionStatus(connected);
    };
}

// Load available tracks from server
async function loadTracks() {
    try {
        const response = await fetch('/api/tracks');
        const data = await response.json();

        // Clear loading text
        loadingText.classList.add('hidden');

        // Populate track list
        data.tracks.forEach(track => {
            const trackOption = createTrackOption(track);
            trackList.appendChild(trackOption);
        });
    } catch (error) {
        console.error('Failed to load tracks:', error);
        loadingText.textContent = 'Failed to load tracks';
    }
}

// Create track option element
function createTrackOption(track) {
    const div = document.createElement('div');
    div.className = 'track-option';
    div.innerHTML = `
        <h3>${track.name}</h3>
        <span class="difficulty">${track.difficulty}</span>
        <p>${track.description}</p>
    `;

    div.addEventListener('click', () => {
        startGame(track.id);
    });

    return div;
}

// Start game with selected track
async function startGame(trackId) {
    console.log('Starting game with track:', trackId);

    // Hide track selection menu
    trackSelectMenu.classList.add('hidden');

    try {
        // Connect to server
        await gameClient.connect();

        // Change to selected track
        gameClient.changeTrack(trackId);

        // Start game loop
        startGameLoop();
    } catch (error) {
        console.error('Failed to start game:', error);
        alert('Failed to connect to game server');
        trackSelectMenu.classList.remove('hidden');
    }
}

// Main game loop
function startGameLoop() {
    let lastInputTime = 0;
    const inputInterval = 1000 / 30; // Send input 30 times per second

    function gameLoop(timestamp) {
        // Send inputs to server
        if (timestamp - lastInputTime >= inputInterval) {
            gameClient.sendInput();
            lastInputTime = timestamp;
        }

        // Render game state
        const state = gameClient.getState();
        if (state) {
            renderer.render(state);
        }

        // Continue loop
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Start the loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update UI elements based on game state
function updateUI(state) {
    if (!state || !state.car) return;

    const car = state.car;

    // Update speed display (convert to km/h)
    const speedKmh = Math.round(car.speed * 0.15); // Rough conversion
    speedValue.textContent = speedKmh;

    // Update drift score
    driftScore.textContent = car.drift_score;

    // Update combo multiplier
    comboValue.textContent = `x${car.combo_multiplier.toFixed(1)}`;

    // Show/hide drift indicator
    if (car.is_drifting) {
        driftIndicator.classList.remove('hidden');
    } else {
        driftIndicator.classList.add('hidden');
    }
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    if (connected) {
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusIndicator.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (gameClient) {
        gameClient.disconnect();
    }
});

// Start the game when page loads
window.addEventListener('load', init);
