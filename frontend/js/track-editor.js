/**
 * Track Editor - Main logic and state management
 */

// Editor state
const editorState = {
    tool: 'outer',
    outerPoints: [],
    innerPoints: [],
    spawnPoint: null,
    finishLine: null,
    hoverPoint: null,
    history: [],
    historyIndex: -1
};

let renderer;
let tools;

// Initialize editor
window.addEventListener('load', () => {
    const canvas = document.getElementById('editorCanvas');
    renderer = new EditorRenderer(canvas);
    tools = new EditorTools(canvas, renderer, handleToolCallback);

    setupUI();
    render();
    startRenderLoop();
});

function setupUI() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            editorState.tool = btn.dataset.tool;
        });
    });

    // Action buttons
    document.getElementById('btn-close-outer').addEventListener('click', closeOuterLoop);
    document.getElementById('btn-close-inner').addEventListener('click', closeInnerLoop);
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-redo').addEventListener('click', redo);
    document.getElementById('btn-clear').addEventListener('click', clearAll);
    document.getElementById('btn-back').addEventListener('click', () => window.location.href = '/');

    // Save/Load/Test buttons
    document.getElementById('btn-save').addEventListener('click', saveTrack);
    document.getElementById('btn-load').addEventListener('click', showLoadModal);
    document.getElementById('btn-test').addEventListener('click', testTrack);
    document.getElementById('btn-export').addEventListener('click', exportJSON);

    // Grid toggle
    document.getElementById('show-grid').addEventListener('change', (e) => {
        renderer.showGrid = e.target.checked;
        render();
    });

    // Modal close
    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
        document.getElementById('load-modal').classList.add('hidden');
    });
}

function handleToolCallback(action, data) {
    switch(action) {
        case 'getState':
            return editorState;
        case 'addOuterPoint':
            addPoint(editorState.outerPoints, data);
            break;
        case 'addInnerPoint':
            addPoint(editorState.innerPoints, data);
            break;
        case 'setSpawnPoint':
            editorState.spawnPoint = data;
            saveHistory();
            break;
        case 'setFinishLine':
            editorState.finishLine = data;
            saveHistory();
            break;
        case 'setHoverPoint':
            editorState.hoverPoint = data;
            break;
        case 'deletePoint':
            deletePoint(data);
            break;
        case 'render':
            render();
            break;
    }
    updateStats();
    render();
}

function addPoint(pointsArray, point) {
    pointsArray.push(point);
    saveHistory();
}

function deletePoint(point) {
    const outerIndex = editorState.outerPoints.indexOf(point);
    if (outerIndex !== -1) {
        editorState.outerPoints.splice(outerIndex, 1);
        saveHistory();
        return;
    }

    const innerIndex = editorState.innerPoints.indexOf(point);
    if (innerIndex !== -1) {
        editorState.innerPoints.splice(innerIndex, 1);
        saveHistory();
    }
}

function closeOuterLoop() {
    if (editorState.outerPoints.length >= 3) {
        // Already handled by rendering as closed loop
        showMessage('Outer boundary closed!', 'success');
    } else {
        showMessage('Need at least 3 points to close loop', 'error');
    }
}

function closeInnerLoop() {
    if (editorState.innerPoints.length >= 3) {
        showMessage('Inner boundary closed!', 'success');
    } else {
        showMessage('Need at least 3 points to close loop', 'error');
    }
}

function clearAll() {
    if (confirm('Clear all track data? This cannot be undone.')) {
        editorState.outerPoints = [];
        editorState.innerPoints = [];
        editorState.spawnPoint = null;
        editorState.finishLine = null;
        editorState.history = [];
        editorState.historyIndex = -1;
        updateStats();
        render();
    }
}

function saveHistory() {
    // Remove future history if we're not at the end
    editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);

    // Save current state
    editorState.history.push({
        outerPoints: JSON.parse(JSON.stringify(editorState.outerPoints)),
        innerPoints: JSON.parse(JSON.stringify(editorState.innerPoints)),
        spawnPoint: editorState.spawnPoint ? {...editorState.spawnPoint} : null,
        finishLine: editorState.finishLine ? {...editorState.finishLine} : null
    });

    editorState.historyIndex++;

    // Limit history size
    if (editorState.history.length > 50) {
        editorState.history.shift();
        editorState.historyIndex--;
    }
}

function undo() {
    if (editorState.historyIndex > 0) {
        editorState.historyIndex--;
        const state = editorState.history[editorState.historyIndex];
        editorState.outerPoints = JSON.parse(JSON.stringify(state.outerPoints));
        editorState.innerPoints = JSON.parse(JSON.stringify(state.innerPoints));
        editorState.spawnPoint = state.spawnPoint ? {...state.spawnPoint} : null;
        editorState.finishLine = state.finishLine ? {...state.finishLine} : null;
        updateStats();
        render();
    }
}

function redo() {
    if (editorState.historyIndex < editorState.history.length - 1) {
        editorState.historyIndex++;
        const state = editorState.history[editorState.historyIndex];
        editorState.outerPoints = JSON.parse(JSON.stringify(state.outerPoints));
        editorState.innerPoints = JSON.parse(JSON.stringify(state.innerPoints));
        editorState.spawnPoint = state.spawnPoint ? {...state.spawnPoint} : null;
        editorState.finishLine = state.finishLine ? {...state.finishLine} : null;
        updateStats();
        render();
    }
}

async function saveTrack() {
    const name = document.getElementById('track-name').value.trim();
    const difficulty = document.getElementById('track-difficulty').value;
    const description = document.getElementById('track-description').value.trim();
    const author = document.getElementById('track-author').value.trim() || 'Anonymous';

    // Validation
    if (!name) {
        showMessage('Please enter a track name', 'error');
        return;
    }

    if (editorState.outerPoints.length < 3) {
        showMessage('Outer boundary needs at least 3 points', 'error');
        return;
    }

    if (!editorState.spawnPoint) {
        showMessage('Please set a spawn point', 'error');
        return;
    }

    // Convert points to boundary segments
    const outerBoundaries = pointsToSegments(editorState.outerPoints);
    const innerBoundaries = pointsToSegments(editorState.innerPoints);

    const trackData = {
        name,
        difficulty,
        description,
        author,
        outer_boundaries: outerBoundaries,
        inner_boundaries: innerBoundaries,
        spawn_point: {
            x: editorState.spawnPoint.x,
            y: editorState.spawnPoint.y,
            angle: editorState.spawnPoint.angle
        },
        finish_line: editorState.finishLine ? {
            start: [editorState.finishLine.start.x, editorState.finishLine.start.y],
            end: [editorState.finishLine.end.x, editorState.finishLine.end.y]
        } : null
    };

    try {
        const response = await fetch('/api/custom-tracks', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(trackData)
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(`Track "${name}" saved successfully!`, 'success');
        } else {
            showMessage('Failed to save track', 'error');
        }
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

async function showLoadModal() {
    const modal = document.getElementById('load-modal');
    const container = document.getElementById('track-list-container');

    try {
        const response = await fetch('/api/custom-tracks');
        const data = await response.json();

        container.innerHTML = '';
        if (data.tracks.length === 0) {
            container.innerHTML = '<p style="color: #aaa;">No custom tracks found</p>';
        } else {
            data.tracks.forEach(track => {
                const div = document.createElement('div');
                div.className = 'track-item';
                div.innerHTML = `
                    <h3>${track.name}</h3>
                    <div class="track-meta">${track.difficulty} • by ${track.author}</div>
                    <p>${track.description}</p>
                `;
                div.addEventListener('click', () => loadTrack(track.id));
                container.appendChild(div);
            });
        }

        modal.classList.remove('hidden');
    } catch (error) {
        showMessage(`Error loading tracks: ${error.message}`, 'error');
    }
}

async function loadTrack(trackId) {
    try {
        const response = await fetch(`/api/custom-tracks/${trackId}`);
        const track = await response.json();

        // Load track data into editor
        editorState.outerPoints = segmentsToPoints(track.outer_boundaries);
        editorState.innerPoints = segmentsToPoints(track.inner_boundaries);
        editorState.spawnPoint = track.spawn_point ? {
            x: track.spawn_point.x,
            y: track.spawn_point.y,
            angle: track.spawn_point.angle
        } : null;
        editorState.finishLine = track.finish_line ? {
            start: {x: track.finish_line.start[0], y: track.finish_line.start[1]},
            end: {x: track.finish_line.end[0], y: track.finish_line.end[1]}
        } : null;

        // Update form fields
        document.getElementById('track-name').value = track.name;
        document.getElementById('track-difficulty').value = track.difficulty;
        document.getElementById('track-description').value = track.description;
        document.getElementById('track-author').value = track.author;

        document.getElementById('load-modal').classList.add('hidden');
        updateStats();
        render();
        showMessage('Track loaded!', 'success');
    } catch (error) {
        showMessage(`Error loading track: ${error.message}`, 'error');
    }
}

function testTrack() {
    if (editorState.outerPoints.length < 3) {
        showMessage('Create a track first!', 'error');
        return;
    }

    showMessage('Test track feature coming soon!', 'success');
}

function exportJSON() {
    const name = document.getElementById('track-name').value.trim() || 'track';
    const trackData = {
        name,
        outer_boundaries: pointsToSegments(editorState.outerPoints),
        inner_boundaries: pointsToSegments(editorState.innerPoints),
        spawn_point: editorState.spawnPoint,
        finish_line: editorState.finishLine
    };

    const blob = new Blob([JSON.stringify(trackData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function pointsToSegments(points) {
    const segments = [];
    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        segments.push([[current.x, current.y], [next.x, next.y]]);
    }
    return segments;
}

function segmentsToPoints(segments) {
    const points = [];
    segments.forEach(seg => {
        // Only add start point (to avoid duplicates)
        points.push({x: seg[0][0], y: seg[0][1]});
    });
    return points;
}

function updateStats() {
    document.getElementById('stat-outer-points').textContent = editorState.outerPoints.length;
    document.getElementById('stat-inner-points').textContent = editorState.innerPoints.length;
    document.getElementById('stat-spawn').textContent = editorState.spawnPoint ? '✅' : '❌';
    document.getElementById('stat-finish').textContent = editorState.finishLine ? '✅' : '❌';
}

function showMessage(message, type) {
    const status = document.getElementById('validation-status');
    status.textContent = message;
    status.className = type;

    setTimeout(() => {
        status.textContent = '';
        status.className = '';
    }, 5000);
}

function render() {
    renderer.render(editorState);
}

function startRenderLoop() {
    setInterval(render, 1000 / 30); // 30 FPS
}
