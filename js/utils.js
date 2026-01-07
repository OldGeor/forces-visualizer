// ===== 工具函数 =====

function getRandomBrightColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 50%)`;
}

function getCanvasBounds() {
    return {
        left: (-elements.canvas.width/2 - state.viewOffsetX) / state.viewScale,
        right: (elements.canvas.width/2 - state.viewOffsetX) / state.viewScale,
        top: (-elements.canvas.height/2 - state.viewOffsetY) / state.viewScale,
        bottom: (elements.canvas.height/2 - state.viewOffsetY) / state.viewScale
    };
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
        param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
}

function zoom(factor) {
    state.viewScale *= factor;
    draw();
}

function fitToView() {
    if (state.forces.length === 0) {
        state.viewScale = 1;
        state.viewOffsetX = 0;
        state.viewOffsetY = 0;
        draw();
        return;
    }
    
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    
    state.forces.forEach(force => {
        const angleRad = force.angle * Math.PI / 180;
        const length = force.magnitude * CONFIG.SCALE_FACTOR;
        const endX = length * Math.cos(angleRad);
        const endY = -length * Math.sin(angleRad);
        
        minX = Math.min(minX, endX);
        maxX = Math.max(maxX, endX);
        minY = Math.min(minY, endY);
        maxY = Math.max(maxY, endY);
        
        if (force.decomposed) {
            minX = Math.min(minX, force.fx * CONFIG.SCALE_FACTOR);
            maxX = Math.max(maxX, force.fx * CONFIG.SCALE_FACTOR);
            minY = Math.min(minY, -force.fy * CONFIG.SCALE_FACTOR);
            maxY = Math.max(maxY, -force.fy * CONFIG.SCALE_FACTOR);
        }
    });
    
    const margin = 50;
    minX -= margin;
    maxX += margin;
    minY -= margin;
    maxY += margin;
    
    const scaleX = elements.canvas.width / (maxX - minX);
    const scaleY = elements.canvas.height / (maxY - minY);
    state.viewScale = Math.min(scaleX, scaleY) * 0.9;
    
    state.viewOffsetX = -(minX + maxX) / 2 * state.viewScale;
    state.viewOffsetY = -(minY + maxY) / 2 * state.viewScale;
    
    draw();
}