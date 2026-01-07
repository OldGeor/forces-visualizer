// ===== 数据操作功能 =====

function exportData() {
    const data = {
        forces: state.forces,
        resultantForce: state.resultantForce,
        resultantColor: state.resultantColor,
        showResultant: state.showResultant,
        exportTime: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'force_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!data.forces || !Array.isArray(data.forces)) {
                    alert('无效的数据文件格式');
                    return;
                }
                
                state.forces = data.forces;
                state.resultantForce = data.resultantForce || null;
                state.resultantColor = data.resultantColor || "#d13438";
                state.showResultant = data.showResultant !== undefined ? data.showResultant : true;
                
                if (state.forces.length > 0) {
                    state.nextForceId = Math.max(...state.forces.map(f => f.id)) + 1;
                    state.nextForceNumber = Math.max(...state.forces.map(f => {
                        const match = f.name.match(/F<sub>(\d+)<\/sub>/);
                        return match ? parseInt(match[1]) : 0;
                    })) + 1;
                } else {
                    state.nextForceId = 1;
                    state.nextForceNumber = 1;
                }
                
                updateUI();
                saveStateToHistory();
                alert('数据导入成功！');
            } catch (error) {
                alert('导入数据时出错：' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function viewData() {
    const dataTableBody = document.getElementById('dataTableBody');
    dataTableBody.innerHTML = '';
    
    state.forces.forEach(force => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${force.name.replace('<sub>', '').replace('</sub>', '')}</td>
            <td>${force.magnitude.toFixed(2)}</td>
            <td>${force.angle.toFixed(1)}</td>
            <td>${(force.magnitude * Math.cos(force.angle * Math.PI / 180)).toFixed(2)}</td>
            <td>${(force.magnitude * Math.sin(force.angle * Math.PI / 180)).toFixed(2)}</td>
            <td>${force.color}</td>
        `;
        dataTableBody.appendChild(row);
    });
    
    if (state.resultantForce && state.resultantForce.magnitude > 0) {
        const row = document.createElement('tr');
        row.style.backgroundColor = 'rgba(209, 52, 56, 0.1)';
        row.innerHTML = `
            <td>F合</td>
            <td>${state.resultantForce.magnitude.toFixed(2)}</td>
            <td>${state.resultantForce.angle.toFixed(1)}</td>
            <td>${state.resultantForce.fx.toFixed(2)}</td>
            <td>${state.resultantForce.fy.toFixed(2)}</td>
            <td>${state.resultantColor}</td>
        `;
        dataTableBody.appendChild(row);
    }
    
    document.getElementById('dataModal').style.display = 'flex';
}

function hideDataModal() {
    document.getElementById('dataModal').style.display = 'none';
}

function showHelp() {
    document.getElementById('helpModal').style.display = 'flex';
}

function hideHelp() {
    document.getElementById('helpModal').style.display = 'none';
}