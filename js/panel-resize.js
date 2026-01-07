// ===== 面板调整功能 =====

function startResize(e) {
    state.isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
}

function resize(e) {
    if (!state.isResizing) return;
    
    const container = document.querySelector('.container');
    const controlPanel = document.querySelector('.control-panel');
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = containerRect.width - (e.clientX - containerRect.left);
    
    if (newWidth > 300 && newWidth < containerRect.width - 300) {
        controlPanel.style.width = newWidth + 'px';
    }
}

function stopResize() {
    state.isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    resizeCanvas();
}