// ===== 力管理 =====

function addForce() {
    const magnitude = parseInt(document.getElementById('forceMagnitudeInput').value);
    const angle = parseInt(document.getElementById('forceAngleInput').value);
    const color = state.fixedColor ? 
        document.getElementById('forceColor').value : 
        getRandomBrightColor();
    
    if (!state.fixedColor) {
        document.getElementById('forceColor').value = color;
    }
    
    const force = {
        id: state.nextForceId++,
        name: `F<sub>${state.nextForceNumber++}</sub>`,
        magnitude: magnitude,
        angle: angle,
        color: color,
        decomposed: false,
        fx: 0,
        fy: 0
    };
    
    state.forces.push(force);
    updateUI();
    
    // 更新默认值
    state.defaultMagnitude += 5;
    state.defaultAngle = (state.defaultAngle + 30) % 360;
    
    document.getElementById('forceMagnitude').value = Math.min(100, state.defaultMagnitude);
    document.getElementById('forceMagnitudeInput').value = state.defaultMagnitude;
    document.getElementById('forceAngle').value = state.defaultAngle;
    document.getElementById('forceAngleInput').value = state.defaultAngle;
    
    saveStateToHistory();
}

function decomposeForce(force) {
    const angleRad = force.angle * Math.PI / 180;
    force.fx = force.magnitude * Math.cos(angleRad);
    force.fy = force.magnitude * Math.sin(angleRad);
}

function updateResultant() {
    let fxTotal = 0;
    let fyTotal = 0;
    
    state.forces.forEach(force => {
        const angleRad = force.angle * Math.PI / 180;
        fxTotal += force.magnitude * Math.cos(angleRad);
        fyTotal += force.magnitude * Math.sin(angleRad);
    });
    
    const resultantMagnitude = Math.sqrt(fxTotal * fxTotal + fyTotal * fyTotal);
    let resultantAngle = Math.atan2(fyTotal, fxTotal) * 180 / Math.PI;
    if (resultantAngle < 0) resultantAngle += 360;
    
    state.resultantForce = {
        magnitude: resultantMagnitude,
        angle: resultantAngle,
        fx: fxTotal,
        fy: fyTotal,
        decomposed: state.resultantForce ? state.resultantForce.decomposed : false
    };
    
    elements.resultantValue.textContent = resultantMagnitude.toFixed(2) + ' N';
    elements.resultantAngle.textContent = resultantAngle.toFixed(1) + '°';
}