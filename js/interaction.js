// ===== 交互事件处理 =====

function handleMouseDown(e) {
    const { x, y } = getMousePosition(e);
    handlePointerDown(x, y);
}

function handleMouseMove(e) {
    if (!state.isDragging) return;
    
    const { x, y } = getMousePosition(e);
    handlePointerMove(x, y);
}

function handleMouseUp() {
    handlePointerUp();
}

function handleWheel(e) {
    e.preventDefault();
    
    const rect = elements.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = Math.exp(wheel * zoomIntensity);
    
    const worldX = (mouseX - elements.canvas.width/2 - state.viewOffsetX) / state.viewScale;
    const worldY = (mouseY - elements.canvas.height/2 - state.viewOffsetY) / state.viewScale;
    
    state.viewScale *= zoomFactor;
    
    state.viewOffsetX = mouseX - elements.canvas.width/2 - worldX * state.viewScale;
    state.viewOffsetY = mouseY - elements.canvas.height/2 - worldY * state.viewScale;
    
    draw();
}

function handleTouchStart(e) {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 1) {
        const { x, y } = getTouchPosition(touches[0]);
        handlePointerDown(x, y);
    } else if (touches.length === 2) {
        state.isPinching = true;
        state.touchStartDistance = getTouchDistance(touches[0], touches[1]);
        state.touchStartScale = state.viewScale;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 1 && !state.isPinching) {
        const { x, y } = getTouchPosition(touches[0]);
        handlePointerMove(x, y);
    } else if (touches.length === 2 && state.isPinching) {
        const currentDistance = getTouchDistance(touches[0], touches[1]);
        const scaleFactor = currentDistance / state.touchStartDistance;
        state.viewScale = state.touchStartScale * scaleFactor;
        draw();
    }
}

function handleTouchEnd(e) {
    if (e.touches.length === 0) {
        state.isPinching = false;
        handlePointerUp();
    }
}

function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getTouchPosition(touch) {
    const rect = elements.canvas.getBoundingClientRect();
    return {
        x: (touch.clientX - rect.left - elements.canvas.width/2 - state.viewOffsetX) / state.viewScale,
        y: (touch.clientY - rect.top - elements.canvas.height/2 - state.viewOffsetY) / state.viewScale
    };
}

function getMousePosition(e) {
    const rect = elements.canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - elements.canvas.width/2 - state.viewOffsetX) / state.viewScale,
        y: (e.clientY - rect.top - elements.canvas.height/2 - state.viewOffsetY) / state.viewScale
    };
}

function handlePointerDown(x, y) {
    // 检查是否点击了控制点
    if (state.selectedForce) {
        const force = state.selectedForce;
        const angleRad = force.angle * Math.PI / 180;
        const length = force.magnitude * CONFIG.SCALE_FACTOR;
        const endX = length * Math.cos(angleRad);
        const endY = -length * Math.sin(angleRad);
        
        // 控制点位置计算
        const cp1X = endX, cp1Y = endY;
        const cp2X = endX + CONFIG.CONTROL_POINT_DISTANCE * Math.cos(angleRad);
        const cp2Y = endY - CONFIG.CONTROL_POINT_DISTANCE * Math.sin(angleRad);
        const cp3X = endX - CONFIG.CONTROL_POINT_DISTANCE * Math.cos(angleRad);
        const cp3Y = endY + CONFIG.CONTROL_POINT_DISTANCE * Math.sin(angleRad);
        
        // 检查控制点点击
        const distances = [
            {point: 1, dist: Math.sqrt((x - cp1X) ** 2 + (y - cp1Y) ** 2)},
            {point: 2, dist: Math.sqrt((x - cp2X) ** 2 + (y - cp2Y) ** 2)},
            {point: 3, dist: Math.sqrt((x - cp3X) ** 2 + (y - cp3Y) ** 2)}
        ];
        
        const clickedPoint = distances.find(d => d.dist < CONFIG.TOUCH_TARGET_SIZE);
        if (clickedPoint) {
            state.draggingControlPoint = clickedPoint.point;
            state.isDragging = true;
            state.dragStartX = x;
            state.dragStartY = y;
            state.dragStartMagnitude = force.magnitude;
            state.dragStartAngle = force.angle;
            return;
        }
    }
    
    // 检查是否点击了力的矢量线
    for (let i = state.forces.length - 1; i >= 0; i--) {
        const force = state.forces[i];
        const angleRad = force.angle * Math.PI / 180;
        const length = force.magnitude * CONFIG.SCALE_FACTOR;
        const endX = length * Math.cos(angleRad);
        const endY = -length * Math.sin(angleRad);
        
        const distance = pointToLineDistance(x, y, 0, 0, endX, endY);
        
        if (distance < CONFIG.TOUCH_TARGET_SIZE) {
            state.selectedForce = force;
            state.isDragging = true;
            state.dragStartX = x;
            state.dragStartY = y;
            state.draggingControlPoint = 1;
            state.dragStartMagnitude = force.magnitude;
            state.dragStartAngle = force.angle;
            updateForcesTable();
            draw();
            return;
        }
    }
    
    // 如果没有点击控制点或力矢量，取消选择
    state.selectedForce = null;
    state.draggingControlPoint = null;
    updateForcesTable();
    draw();
}

function handlePointerMove(x, y) {
    if (!state.isDragging || !state.selectedForce || !state.draggingControlPoint) return;
    
    const force = state.selectedForce;
    
    if (state.draggingControlPoint === 1) {
        // 控制点1: 同时改变大小和方向
        const dx = x, dy = y;
        const newMagnitude = Math.sqrt(dx * dx + dy * dy) / CONFIG.SCALE_FACTOR;
        let newAngle = Math.atan2(-dy, dx) * 180 / Math.PI;
        if (newAngle < 0) newAngle += 360;
        
        force.magnitude = Math.min(CONFIG.MAX_MAGNITUDE, Math.max(CONFIG.MIN_MAGNITUDE, newMagnitude));
        force.angle = newAngle;
    } else if (state.draggingControlPoint === 2) {
        // 控制点2: 只改变大小 - 基于相对变化
        const currentAngleRad = state.dragStartAngle * Math.PI / 180;
        const currentProjection = x * Math.cos(currentAngleRad) + (-y) * Math.sin(currentAngleRad);
        const startProjection = state.dragStartX * Math.cos(currentAngleRad) + (-state.dragStartY) * Math.sin(currentAngleRad);
        const delta = (currentProjection - startProjection) / CONFIG.SCALE_FACTOR;
        
        const newMagnitude = Math.max(CONFIG.MIN_MAGNITUDE, state.dragStartMagnitude + delta);
        force.magnitude = Math.min(CONFIG.MAX_MAGNITUDE, newMagnitude);
        force.angle = state.dragStartAngle;
    } else if (state.draggingControlPoint === 3) {
        // 控制点3: 只改变方向
        const dx = x, dy = y;
        let newAngle = Math.atan2(-dy, dx) * 180 / Math.PI;
        if (newAngle < 0) newAngle += 360;
        
        force.angle = newAngle;
        force.magnitude = state.dragStartMagnitude;
    }
    
    if (force.decomposed) decomposeForce(force);
    updateUI();
}

function handlePointerUp() {
    if (state.isDragging) {
        saveStateToHistory();
    }
    state.isDragging = false;
    state.draggingControlPoint = null;
}