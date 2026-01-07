// ===== 撤销/重做功能 =====

function saveStateToHistory() {
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    
    const stateCopy = JSON.parse(JSON.stringify({
        forces: state.forces,
        nextForceId: state.nextForceId,
        nextForceNumber: state.nextForceNumber,
        resultantForce: state.resultantForce,
        resultantColor: state.resultantColor,
        showResultant: state.showResultant
    }));
    
    state.history.push(stateCopy);
    
    if (state.history.length > CONFIG.HISTORY_LIMIT) {
        state.history.shift();
    }
    
    state.historyIndex = state.history.length - 1;
    updateHistoryButtons();
}

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreStateFromHistory();
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreStateFromHistory();
    }
}

function restoreStateFromHistory() {
    const historyState = state.history[state.historyIndex];
    
    state.forces = JSON.parse(JSON.stringify(historyState.forces));
    state.nextForceId = historyState.nextForceId;
    state.nextForceNumber = historyState.nextForceNumber;
    state.resultantForce = historyState.resultantForce ? JSON.parse(JSON.stringify(historyState.resultantForce)) : null;
    state.resultantColor = historyState.resultantColor;
    state.showResultant = historyState.showResultant;
    
    updateUI();
    updateHistoryButtons();
}

function updateHistoryButtons() {
    elements.undoBtn.disabled = state.historyIndex <= 0;
    elements.redoBtn.disabled = state.historyIndex >= state.history.length - 1;
}