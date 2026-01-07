// ===== 界面更新 =====

function updateUI() {
    updateResultant();
    updateForcesTable();
    draw();
}

function updateForcesTable() {
    elements.forcesList.innerHTML = '';
    
    // 添加普通力
    state.forces.forEach(force => {
        const row = createForceRow(force);
        elements.forcesList.appendChild(row);
    });
    
    // 添加合力行
    if (state.resultantForce && state.resultantForce.magnitude > 0) {
        const resultantRow = createResultantRow();
        elements.forcesList.appendChild(resultantRow);
    }
    
    // 添加事件监听
    addTableEventListeners();
}

function createForceRow(force) {
    const row = document.createElement('tr');
    row.className = `force-row ${state.selectedForce && state.selectedForce.id === force.id ? 'selected' : ''}`;
    
    row.innerHTML = `
        <td class="force-name">${force.name}</td>
        <td>
            <input type="color" value="${force.color}" data-id="${force.id}" class="force-color-input" style="background-color: ${force.color}">
        </td>
        <td>
            <input type="number" value="${force.magnitude}" min="${CONFIG.MIN_MAGNITUDE}" max="${CONFIG.MAX_MAGNITUDE}" data-id="${force.id}" class="force-magnitude-input">
        </td>
        <td>
            <input type="number" value="${force.angle}" min="${CONFIG.MIN_ANGLE}" max="${CONFIG.MAX_ANGLE}" data-id="${force.id}" class="force-angle-input">
        </td>
        <td class="component-display">
            ${force.decomposed ? `F<sub>x</sub>: ${force.fx.toFixed(2)}<br>F<sub>y</sub>: ${force.fy.toFixed(2)}` : '-'}
        </td>
        <td>
            <button class="btn btn-decompose" data-id="${force.id}">${force.decomposed ? '隐藏分解' : '分解'}</button>
        </td>
        <td>
            <button class="btn btn-delete" data-id="${force.id}">删除</button>
        </td>
    `;
    
    return row;
}

function createResultantRow() {
    const resultantRow = document.createElement('tr');
    resultantRow.className = 'resultant-row';
    resultantRow.innerHTML = `
        <td class="force-name">F<span class="force-name-subscript">合</span></td>
        <td>
            <input type="color" value="${state.resultantColor}" id="resultantColorTable" class="force-color-input" style="background-color: ${state.resultantColor}">
        </td>
        <td>
            <input type="number" value="${state.resultantForce.magnitude.toFixed(2)}" readonly>
        </td>
        <td>
            <input type="number" value="${state.resultantForce.angle.toFixed(1)}" readonly>
        </td>
        <td class="component-display">
            ${state.resultantForce.decomposed ? `F<sub>x</sub>: ${state.resultantForce.fx.toFixed(2)}<br>F<sub>y</sub>: ${state.resultantForce.fy.toFixed(2)}` : '-'}
        </td>
        <td>
            <button class="btn btn-decompose" id="decomposeResultant">${state.resultantForce.decomposed ? '隐藏分解' : '分解'}</button>
        </td>
        <td>
            <button class="btn btn-hide" id="hideResultant">${state.showResultant ? '隐藏' : '显示'}</button>
        </td>
    `;
    
    return resultantRow;
}

function addTableEventListeners() {
    // 输入框事件
    addInputEventListeners('.force-magnitude-input', 'magnitude');
    addInputEventListeners('.force-angle-input', 'angle');
    
    // 颜色选择器
    document.querySelectorAll('.force-color-input').forEach(input => {
        input.addEventListener('input', function() {
            if (this.id === 'resultantColorTable') {
                state.resultantColor = this.value;
            } else {
                const id = parseInt(this.getAttribute('data-id'));
                const force = state.forces.find(f => f.id === id);
                if (force) force.color = this.value;
            }
            draw();
            saveStateToHistory();
        });
    });
    
    // 分解按钮
    document.querySelectorAll('.btn-decompose').forEach(button => {
        if (button.id !== 'decomposeResultant') {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const force = state.forces.find(f => f.id === id);
                if (force) {
                    force.decomposed = !force.decomposed;
                    if (force.decomposed) decomposeForce(force);
                    updateUI();
                    saveStateToHistory();
                }
            });
        }
    });
    
    // 删除按钮
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            state.forces = state.forces.filter(f => f.id !== id);
            if (state.selectedForce && state.selectedForce.id === id) {
                state.selectedForce = null;
            }
            updateUI();
            saveStateToHistory();
        });
    });
    
    // 合力操作
    const hideBtn = document.getElementById('hideResultant');
    const decomposeBtn = document.getElementById('decomposeResultant');
    if (hideBtn) {
        hideBtn.addEventListener('click', () => {
            state.showResultant = !state.showResultant;
            elements.resultantDisplay.style.display = state.showResultant ? 'flex' : 'none';
            hideBtn.textContent = state.showResultant ? '隐藏' : '显示';
            draw();
        });
    }
    if (decomposeBtn) {
        decomposeBtn.addEventListener('click', () => {
            if (state.resultantForce) {
                state.resultantForce.decomposed = !state.resultantForce.decomposed;
                if (state.resultantForce.decomposed) decomposeForce(state.resultantForce);
                updateForcesTable();
                draw();
            }
        });
    }
}

function addInputEventListeners(selector, property) {
    document.querySelectorAll(selector).forEach(input => {
        const handleUpdate = function() {
            const id = parseInt(this.getAttribute('data-id'));
            const force = state.forces.find(f => f.id === id);
            if (force) {
                let value = parseInt(this.value) || (property === 'magnitude' ? CONFIG.MIN_MAGNITUDE : CONFIG.MIN_ANGLE);
                if (property === 'angle') value = ((value % CONFIG.MAX_ANGLE) + CONFIG.MAX_ANGLE) % CONFIG.MAX_ANGLE;
                force[property] = value;
                if (force.decomposed) decomposeForce(force);
                updateUI();
                saveStateToHistory();
            }
        };
        
        input.addEventListener('blur', handleUpdate);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUpdate.call(e.target);
        });
    });
}