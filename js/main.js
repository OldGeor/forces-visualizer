// ===== 主初始化逻辑 =====

function init() {
    // 初始化DOM引用
    elements.canvas = document.getElementById('forceCanvas');
    elements.ctx = elements.canvas.getContext('2d');
    elements.resultantDisplay = document.getElementById('resultantDisplay');
    elements.resultantValue = document.getElementById('resultantValue');
    elements.resultantAngle = document.getElementById('resultantAngle');
    elements.forcesList = document.getElementById('forcesList');
    elements.undoBtn = document.getElementById('undoBtn');
    elements.redoBtn = document.getElementById('redoBtn');
    
    // 设置画布大小和事件监听
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    initEventListeners();
    
    // 初始化状态
    saveStateToHistory();
    draw();
}

function resizeCanvas() {
    const container = elements.canvas.parentElement;
    elements.canvas.width = container.clientWidth;
    elements.canvas.height = container.clientHeight;
    draw();
}

function initEventListeners() {
    // 主题和样式控制
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        document.body.className = `theme-${e.target.value}`;
        draw();
    });
    
    document.getElementById('lineWidth').addEventListener('input', (e) => {
        state.lineWidth = parseInt(e.target.value) || CONFIG.DEFAULT_LINE_WIDTH;
        draw();
    });
    
    document.getElementById('backgroundType').addEventListener('change', (e) => {
        state.backgroundType = e.target.value;
        draw();
    });
    
    document.getElementById('fixedColor').addEventListener('change', (e) => {
        state.fixedColor = e.target.checked;
    });
    
    // 力操作
    document.getElementById('addForce').addEventListener('click', addForce);
    
    // 滑块和输入框同步
    initSliderInputSync('forceMagnitude', 'forceMagnitudeInput', CONFIG.MIN_MAGNITUDE, 100);
    initSliderInputSync('forceAngle', 'forceAngleInput', CONFIG.MIN_ANGLE, CONFIG.MAX_ANGLE);
    
    // 视图控制
    document.getElementById('zoomIn').addEventListener('click', () => zoom(1.2));
    document.getElementById('zoomOut').addEventListener('click', () => zoom(1/1.2));
    document.getElementById('zoomFit').addEventListener('click', fitToView);
    
    // 画布交互
    elements.canvas.addEventListener('mousedown', handleMouseDown);
    elements.canvas.addEventListener('mousemove', handleMouseMove);
    elements.canvas.addEventListener('mouseup', handleMouseUp);
    elements.canvas.addEventListener('wheel', handleWheel);
    elements.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.canvas.addEventListener('touchend', handleTouchEnd);
    
    // 面板调整
    const divider = document.getElementById('divider');
    divider.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
    
    // 功能按钮
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
    document.getElementById('viewDataBtn').addEventListener('click', viewData);
    document.getElementById('helpBtn').addEventListener('click', showHelp);
    
    // 模态框控制
    setupModalEvents();
}

function initSliderInputSync(sliderId, inputId, min, max) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);
    
    slider.addEventListener('input', () => input.value = slider.value);
    input.addEventListener('input', () => {
        let value = Math.min(max, Math.max(min, parseInt(input.value) || min));
        input.value = value;
        slider.value = Math.min(100, value);
    });
    
    input.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        let value = parseInt(input.value) + delta;
        value = Math.min(max, Math.max(min, value));
        input.value = value;
        slider.value = Math.min(100, value);
    });
}

function setupModalEvents() {
    // 帮助模态框
    document.getElementById('closeHelpModal').addEventListener('click', hideHelp);
    document.getElementById('closeHelpBtn').addEventListener('click', hideHelp);
    
    // 数据模态框
    document.getElementById('closeDataModal').addEventListener('click', hideDataModal);
    document.getElementById('closeDataBtn').addEventListener('click', hideDataModal);
    
    // 点击外部关闭模态框
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('helpModal')) hideHelp();
        if (e.target === document.getElementById('dataModal')) hideDataModal();
    });
}

// 应用启动
window.onload = init;