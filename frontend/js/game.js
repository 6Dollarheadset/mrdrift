/**
 * Game client for Mr. Drift
 * Manages game state and WebSocket communication
 */

class GameClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.connected = false;
        this.gameState = null;
        this.inputHandler = new InputHandler();
        this.onStateUpdate = null;
        this.onConnectionChange = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsUrl);

                this.ws.onopen = () => {
                    console.log('Connected to game server');
                    this.connected = true;
                    if (this.onConnectionChange) {
                        this.onConnectionChange(true);
                    }
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('Disconnected from game server');
                    this.connected = false;
                    if (this.onConnectionChange) {
                        this.onConnectionChange(false);
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    handleMessage(message) {
        switch (message.type) {
            case 'init':
                // Initial game state received
                this.gameState = message.state;
                console.log('Game initialized', this.gameState);
                if (this.onStateUpdate) {
                    this.onStateUpdate(this.gameState);
                }
                break;

            case 'update':
                // Regular game state update
                this.gameState = message.state;
                if (this.onStateUpdate) {
                    this.onStateUpdate(this.gameState);
                }
                break;

            case 'track_changed':
                // Track was changed
                this.gameState = message.state;
                console.log('Track changed to:', this.gameState.track.id);
                if (this.onStateUpdate) {
                    this.onStateUpdate(this.gameState);
                }
                break;

            case 'reset':
                // Game was reset
                this.gameState = message.state;
                console.log('Game reset');
                if (this.onStateUpdate) {
                    this.onStateUpdate(this.gameState);
                }
                break;
        }
    }

    sendInput() {
        if (!this.connected || !this.ws) return;

        const inputs = this.inputHandler.getState();
        this.ws.send(JSON.stringify({
            type: 'input',
            inputs: inputs
        }));
    }

    changeTrack(trackId) {
        if (!this.connected || !this.ws) return;

        console.log('Changing track to:', trackId);
        this.ws.send(JSON.stringify({
            type: 'change_track',
            track_id: trackId
        }));
    }

    reset() {
        if (!this.connected || !this.ws) return;

        console.log('Resetting game');
        this.ws.send(JSON.stringify({
            type: 'reset'
        }));
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }

    getState() {
        return this.gameState;
    }

    isConnected() {
        return this.connected;
    }
}
