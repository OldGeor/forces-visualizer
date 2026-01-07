// ===== 绘制函数 =====

function draw() {
    // 清除画布
    elements.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // 保存当前状态
    elements.ctx.save();
    
    // 应用视图变换
    elements.ctx.translate(elements.canvas.width / 2 + state.viewOffsetX, elements.canvas.height / 2 + state.viewOffsetY);
    elements.ctx.scale(state.viewScale, state.viewScale);
    
    // 绘制背景和坐标轴
    drawBackground();
    drawAxes();
    
    // 绘制平行四边形法则
    if (state.forces.length === 2 && state.showResultant) {
        drawParallelogramRule();
    }
    
    // 绘制所有力
    state.forces.forEach(force => {
        drawForce(force);
        if (force.decomposed) drawForceComponents(force);
    });
    
    // 绘制合力
    if (state.showResultant && state.resultantForce && state.resultantForce.magnitude > 0) {
        drawResultantForce();
    }
    
    // 绘制坐标轴标签和控制点
    drawAxisLabels();
    if (state.selectedForce) {
        drawControlPoints(state.selectedForce);
    }
    
    // 恢复状态
    elements.ctx.restore();
}

function drawBackground() {
    if (state.backgroundType === "none") return;
    
    const bounds = getCanvasBounds();
    const { left, right, top, bottom } = bounds;
    
    if (state.backgroundType === "grid") {
        elements.ctx.beginPath();
        elements.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
        elements.ctx.lineWidth = 0.5;
        
        // 垂直线
        for (let x = Math.ceil(left / CONFIG.BACKGROUND_SPACING) * CONFIG.BACKGROUND_SPACING; x <= right; x += CONFIG.BACKGROUND_SPACING) {
            elements.ctx.moveTo(x, top);
            elements.ctx.lineTo(x, bottom);
        }
        
        // 水平线
        for (let y = Math.ceil(top / CONFIG.BACKGROUND_SPACING) * CONFIG.BACKGROUND_SPACING; y <= bottom; y += CONFIG.BACKGROUND_SPACING) {
            elements.ctx.moveTo(left, y);
            elements.ctx.lineTo(right, y);
        }
        
        elements.ctx.stroke();
    } else if (state.backgroundType === "dots") {
        elements.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
        
        for (let x = Math.ceil(left / CONFIG.BACKGROUND_SPACING) * CONFIG.BACKGROUND_SPACING; x <= right; x += CONFIG.BACKGROUND_SPACING) {
            for (let y = Math.ceil(top / CONFIG.BACKGROUND_SPACING) * CONFIG.BACKGROUND_SPACING; y <= bottom; y += CONFIG.BACKGROUND_SPACING) {
                elements.ctx.beginPath();
                elements.ctx.arc(x, y, 1, 0, Math.PI * 2);
                elements.ctx.fill();
            }
        }
    }
}

function drawAxes() {
    const bounds = getCanvasBounds();
    const { left, right, top, bottom } = bounds;
    const tickSize = 5;
    
    // 绘制坐标轴
    elements.ctx.beginPath();
    elements.ctx.moveTo(left, 0);
    elements.ctx.lineTo(right, 0);
    elements.ctx.moveTo(0, top);
    elements.ctx.lineTo(0, bottom);
    elements.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
    elements.ctx.lineWidth = 1;
    elements.ctx.stroke();
    
    // 绘制刻度
    drawTicks();
    
    // 绘制原点标签
    elements.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
    elements.ctx.font = '10px Arial';
    elements.ctx.textAlign = 'right';
    elements.ctx.textBaseline = 'top';
    elements.ctx.fillText('0', -2, 2);
}

function drawTicks() {
    const bounds = getCanvasBounds();
    const { left, right, top, bottom } = bounds;
    const tickSize = 5;
    
    // X轴刻度
    const startXTick = Math.ceil(left / CONFIG.TICK_SPACING) * CONFIG.TICK_SPACING;
    const endXTick = Math.floor(right / CONFIG.TICK_SPACING) * CONFIG.TICK_SPACING;
    
    for (let i = startXTick; i <= endXTick; i += CONFIG.TICK_SPACING) {
        if (i === 0) continue;
        
        elements.ctx.beginPath();
        elements.ctx.moveTo(i, -tickSize);
        elements.ctx.lineTo(i, tickSize);
        elements.ctx.stroke();
        
        elements.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        elements.ctx.font = '10px Arial';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'top';
        elements.ctx.fillText(i/CONFIG.SCALE_FACTOR, i, tickSize + 5);
    }
    
    // Y轴刻度
    const startYTick = Math.ceil(top / CONFIG.TICK_SPACING) * CONFIG.TICK_SPACING;
    const endYTick = Math.floor(bottom / CONFIG.TICK_SPACING) * CONFIG.TICK_SPACING;
    
    for (let i = startYTick; i <= endYTick; i += CONFIG.TICK_SPACING) {
        if (i === 0) continue;
        
        elements.ctx.beginPath();
        elements.ctx.moveTo(-tickSize, i);
        elements.ctx.lineTo(tickSize, i);
        elements.ctx.stroke();
        
        elements.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        elements.ctx.font = '10px Arial';
        elements.ctx.textAlign = 'right';
        elements.ctx.textBaseline = 'middle';
        elements.ctx.fillText(-i/CONFIG.SCALE_FACTOR, -tickSize - 2, i);
    }
}

function drawAxisLabels() {
    const bounds = getCanvasBounds();
    const { right, top } = bounds;
    
    elements.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
    elements.ctx.font = '12px Arial';
    
    // X轴标签
    elements.ctx.textAlign = 'center';
    elements.ctx.textBaseline = 'bottom';
    elements.ctx.fillText('x', right - 10, -10);
    
    // Y轴标签
    elements.ctx.textAlign = 'left';
    elements.ctx.textBaseline = 'middle';
    elements.ctx.fillText('y', 10, top + 10);
}

function drawForce(force) {
    const angleRad = force.angle * Math.PI / 180;
    const length = force.magnitude * CONFIG.SCALE_FACTOR;
    const endX = length * Math.cos(angleRad);
    const endY = -length * Math.sin(angleRad);
    
    // 绘制力的箭头
    elements.ctx.beginPath();
    elements.ctx.moveTo(0, 0);
    elements.ctx.lineTo(endX, endY);
    elements.ctx.strokeStyle = force.color;
    elements.ctx.lineWidth = state.lineWidth;
    elements.ctx.stroke();
    
    // 绘制箭头头部和标签
    drawArrowhead(0, 0, endX, endY, force.color);
    drawForceLabel(force, endX, endY);
}

function drawForceLabel(force, endX, endY) {
    elements.ctx.fillStyle = force.color;
    elements.ctx.font = 'bold 12px Arial';
    elements.ctx.textAlign = 'left';
    elements.ctx.textBaseline = 'bottom';
    
    const nameParts = force.name.split('<sub>');
    if (nameParts.length > 1) {
        const mainName = nameParts[0];
        const subscript = nameParts[1].replace('</sub>', '');
        
        elements.ctx.fillText(mainName, endX + 5, endY - 5);
        const mainNameWidth = elements.ctx.measureText(mainName).width;
        elements.ctx.font = 'bold 9px Arial';
        elements.ctx.fillText(subscript, endX + 5 + mainNameWidth, endY - 3);
    } else {
        elements.ctx.fillText(force.name, endX + 5, endY - 5);
    }
}

function drawForceComponents(force) {
    const fxLength = force.fx * CONFIG.SCALE_FACTOR;
    const fyLength = -force.fy * CONFIG.SCALE_FACTOR;
    
    // 设置虚线样式
    elements.ctx.setLineDash([5, 5]);
    
    // 绘制x分力
    elements.ctx.beginPath();
    elements.ctx.moveTo(0, 0);
    elements.ctx.lineTo(fxLength, 0);
    elements.ctx.strokeStyle = force.color;
    elements.ctx.lineWidth = state.lineWidth;
    elements.ctx.stroke();
    drawArrowhead(0, 0, fxLength, 0, force.color);
    
    // 绘制y分力
    elements.ctx.beginPath();
    elements.ctx.moveTo(0, 0);
    elements.ctx.lineTo(0, fyLength);
    elements.ctx.stroke();
    drawArrowhead(0, 0, 0, fyLength, force.color);
    
    // 绘制平行四边形
    elements.ctx.beginPath();
    elements.ctx.moveTo(fxLength, 0);
    elements.ctx.lineTo(fxLength, fyLength);
    elements.ctx.lineTo(0, fyLength);
    elements.ctx.stroke();
    
    // 恢复实线
    elements.ctx.setLineDash([]);
    
    // 绘制分力标签
    elements.ctx.fillStyle = force.color;
    elements.ctx.font = '10px Arial';
    elements.ctx.textAlign = 'center';
    elements.ctx.textBaseline = 'bottom';
    elements.ctx.fillText(`${force.fx.toFixed(1)} N`, fxLength/2, -5);
    
    elements.ctx.textAlign = 'right';
    elements.ctx.textBaseline = 'middle';
    elements.ctx.fillText(`${force.fy.toFixed(1)} N`, -5, fyLength/2);
}

function drawParallelogramRule() {
    if (state.forces.length !== 2) return;
    
    const [force1, force2] = state.forces;
    const angleRad1 = force1.angle * Math.PI / 180;
    const angleRad2 = force2.angle * Math.PI / 180;
    
    const length1 = force1.magnitude * CONFIG.SCALE_FACTOR;
    const length2 = force2.magnitude * CONFIG.SCALE_FACTOR;
    
    const endX1 = length1 * Math.cos(angleRad1);
    const endY1 = -length1 * Math.sin(angleRad1);
    const endX2 = length2 * Math.cos(angleRad2);
    const endY2 = -length2 * Math.sin(angleRad2);
    
    elements.ctx.beginPath();
    elements.ctx.moveTo(endX1, endY1);
    elements.ctx.lineTo(endX1 + endX2, endY1 + endY2);
    elements.ctx.lineTo(endX2, endY2);
    elements.ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
    elements.ctx.globalAlpha = 0.5;
    elements.ctx.lineWidth = state.lineWidth;
    elements.ctx.setLineDash([5, 5]);
    elements.ctx.stroke();
    
    elements.ctx.setLineDash([]);
    elements.ctx.globalAlpha = 1;
}

function drawResultantForce() {
    if (!state.resultantForce || state.resultantForce.magnitude === 0) return;
    
    const angleRad = state.resultantForce.angle * Math.PI / 180;
    const resultantLength = state.resultantForce.magnitude * CONFIG.SCALE_FACTOR;
    const endX = state.resultantForce.fx * CONFIG.SCALE_FACTOR;
    const endY = -state.resultantForce.fy * CONFIG.SCALE_FACTOR;
    
    // 绘制合力箭头
    elements.ctx.beginPath();
    elements.ctx.moveTo(0, 0);
    elements.ctx.lineTo(endX, endY);
    elements.ctx.strokeStyle = state.resultantColor;
    elements.ctx.lineWidth = state.lineWidth + 1;
    elements.ctx.stroke();
    
    // 绘制箭头头部和标签
    drawArrowhead(0, 0, endX, endY, state.resultantColor);
    drawForceLabel({name: 'F<sub>合</sub>', color: state.resultantColor}, endX, endY);
    
    // 如果合力已分解，绘制分力
    if (state.resultantForce.decomposed) {
        const fxLength = state.resultantForce.fx * CONFIG.SCALE_FACTOR;
        const fyLength = -state.resultantForce.fy * CONFIG.SCALE_FACTOR;
        
        elements.ctx.setLineDash([5, 5]);
        
        // 绘制x分力
        elements.ctx.beginPath();
        elements.ctx.moveTo(0, 0);
        elements.ctx.lineTo(fxLength, 0);
        elements.ctx.strokeStyle = state.resultantColor;
        elements.ctx.lineWidth = state.lineWidth;
        elements.ctx.stroke();
        drawArrowhead(0, 0, fxLength, 0, state.resultantColor);
        
        // 绘制y分力
        elements.ctx.beginPath();
        elements.ctx.moveTo(0, 0);
        elements.ctx.lineTo(0, fyLength);
        elements.ctx.stroke();
        drawArrowhead(0, 0, 0, fyLength, state.resultantColor);
        
        // 绘制平行四边形
        elements.ctx.beginPath();
        elements.ctx.moveTo(fxLength, 0);
        elements.ctx.lineTo(fxLength, fyLength);
        elements.ctx.lineTo(0, fyLength);
        elements.ctx.stroke();
        
        elements.ctx.setLineDash([]);
        
        // 绘制分力标签
        elements.ctx.fillStyle = state.resultantColor;
        elements.ctx.font = '10px Arial';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'bottom';
        elements.ctx.fillText(`${state.resultantForce.fx.toFixed(1)} N`, fxLength/2, -5);
        
        elements.ctx.textAlign = 'right';
        elements.ctx.textBaseline = 'middle';
        elements.ctx.fillText(`${state.resultantForce.fy.toFixed(1)} N`, -5, fyLength/2);
    }
}

function drawArrowhead(fromX, fromY, toX, toY, color) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    elements.ctx.save();
    elements.ctx.translate(toX, toY);
    elements.ctx.rotate(angle);
    
    elements.ctx.beginPath();
    elements.ctx.moveTo(0, 0);
    elements.ctx.lineTo(-CONFIG.ARROWHEAD_LENGTH, -CONFIG.ARROWHEAD_LENGTH/2);
    elements.ctx.lineTo(-CONFIG.ARROWHEAD_LENGTH, CONFIG.ARROWHEAD_LENGTH/2);
    elements.ctx.closePath();
    elements.ctx.fillStyle = color;
    elements.ctx.fill();
    
    elements.ctx.restore();
}

function drawControlPoints(force) {
    const angleRad = force.angle * Math.PI / 180;
    const length = force.magnitude * CONFIG.SCALE_FACTOR;
    const endX = length * Math.cos(angleRad);
    const endY = -length * Math.sin(angleRad);
    
    // 控制点1: 同时改变大小和方向 (末端)
    const cp1X = endX;
    const cp1Y = endY;
    
    // 控制点2: 只改变大小 (箭头前方)
    const cp2X = endX + CONFIG.CONTROL_POINT_DISTANCE * Math.cos(angleRad);
    const cp2Y = endY - CONFIG.CONTROL_POINT_DISTANCE * Math.sin(angleRad);
    
    // 控制点3: 只改变方向 (箭头后方)
    const cp3X = endX - CONFIG.CONTROL_POINT_DISTANCE * Math.cos(angleRad);
    const cp3Y = endY + CONFIG.CONTROL_POINT_DISTANCE * Math.sin(angleRad);
    
    // 绘制控制点
    drawControlPoint(cp1X, cp1Y, force.color, "");
    drawControlPoint(cp2X, cp2Y, force.color, force.magnitude.toFixed(1) + " N");
    drawControlPoint(cp3X, cp3Y, force.color, force.angle.toFixed(1) + "°");
}

function drawControlPoint(x, y, color, label) {
    // 绘制控制点
    elements.ctx.beginPath();
    elements.ctx.arc(x, y, 6, 0, Math.PI * 2);
    elements.ctx.fillStyle = 'white';
    elements.ctx.fill();
    elements.ctx.strokeStyle = color;
    elements.ctx.lineWidth = 2;
    elements.ctx.stroke();
    
    // 绘制标签
    if (label) {
        elements.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        elements.ctx.font = '10px Arial';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'bottom';
        elements.ctx.fillText(label, x, y - 8);
    }
}