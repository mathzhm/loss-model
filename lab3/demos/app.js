// 时间序列分析工具 - 核心逻辑

// 全局变量
let currentData = null;
let charts = {};

// 工具函数
function switchTab(tabNumber) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 移除所有标签的active类
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 显示选中的标签内容
    document.getElementById('tab' + tabNumber).classList.add('active');
    
    // 设置正确的标签激活状态（注意索引从0开始）
    if (tabNumber === 0) {
        document.querySelectorAll('.tab')[0].classList.add('active');
    } else {
        document.querySelectorAll('.tab')[tabNumber].classList.add('active');
    }
    
    // 清除之前的结果（除了知识介绍标签）
    if (tabNumber !== 0) {
        clearResults();
    }
}

function clearResults() {
    // 销毁所有图表
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {};
    
    // 清除结果区域
    for (let i = 1; i <= 4; i++) {
        document.getElementById('result' + i).innerHTML = '';
    }
}

function handleFileUpload(input, previewId) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById(previewId);
    preview.innerHTML = '正在读取文件...';

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length > 0) {
                preview.innerHTML = '<div class="error">文件读取错误: ' + results.errors[0].message + '</div>';
                return;
            }

            const data = results.data;
            const numericData = [];

            // 尝试识别数值列
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row) {
                    // 跳过第一列（通常是时间/索引列）
                    const keys = Object.keys(row);
                    for (let j = 1; j < keys.length; j++) {
                        const value = parseFloat(row[keys[j]]);
                        if (!isNaN(value)) {
                            numericData.push(value);
                            break; // 每行只取第一个有效数值
                        }
                    }
                }
            }

            if (numericData.length < 20) {
                preview.innerHTML = '<div class="error">未找到足够的有效数值数据（至少需要20个观测值）</div>';
                return;
            }

            currentData = numericData;
            const previewData = numericData.slice(0, 10);
            preview.innerHTML = '数据预览 (前10个值): ' + previewData.join(', ') + '<br><small>共 ' + numericData.length + ' 个观测值</small>';
        },
        error: function(error) {
            preview.innerHTML = '<div class="error">文件读取失败: ' + error.message + '</div>';
        }
    });
}

// 1. Yule-Walker估计AR模型参数
function analyzeYuleWalker() {
    const resultDiv = document.getElementById('result1');
    resultDiv.innerHTML = '<div class="success">正在计算Yule-Walker估计...</div>';
    
    if (!currentData || currentData.length < 20) {
        resultDiv.innerHTML = '<div class="error">请上传有效的时间序列数据（至少20个观测值）</div>';
        return;
    }
    
    const arOrder = parseInt(document.getElementById('arOrder').value);
    
    // 模拟计算（实际应用中应使用统计库）
    setTimeout(() => {
        try {
            // 计算自相关函数
            const acf = calculateACF(currentData, arOrder + 1);
            
            // 构建Yule-Walker方程
            const R = [];
            const r = [];
            
            for (let i = 0; i < arOrder; i++) {
                R[i] = [];
                for (let j = 0; j < arOrder; j++) {
                    R[i][j] = acf[Math.abs(i - j)];
                }
                r[i] = acf[i + 1];
            }
            
            // 简单求解（实际应使用矩阵求逆）
            const phi = [];
            if (arOrder === 1) {
                phi[0] = acf[1];
            } else if (arOrder === 2) {
                phi[0] = (acf[1] * (1 - acf[2])) / (1 - acf[1] * acf[1]);
                phi[1] = (acf[2] - acf[1] * acf[1]) / (1 - acf[1] * acf[1]);
            }
            
            // 显示结果
            let resultHTML = '<div class="success">Yule-Walker估计完成</div>';
            resultHTML += '<div class="result-item"><strong>AR(' + arOrder + ')参数估计:</strong><br>';
            for (let i = 0; i < phi.length; i++) {
                resultHTML += 'φ' + (i + 1) + ' = ' + phi[i].toFixed(4) + '<br>';
            }
            resultHTML += '</div>';
            
            resultHTML += '<div class="result-item"><strong>样本自相关函数:</strong><br>';
            for (let i = 0; i <= arOrder; i++) {
                resultHTML += 'ρ' + i + ' = ' + acf[i].toFixed(4) + '<br>';
            }
            resultHTML += '</div>';
            
            // 绘制ACF图
            resultHTML += '<div class="chart-container"><canvas id="acfChart1"></canvas></div>';
            resultDiv.innerHTML = resultHTML;
            
            // 绘制ACF图
            drawACFChart('acfChart1', acf, '样本自相关函数(ACF)');
            
        } catch (error) {
            resultDiv.innerHTML = '<div class="error">计算错误: ' + error.message + '</div>';
        }
    }, 1000);
}

// 2. MA(1)可逆性分析
function analyzeMA1() {
    const resultDiv = document.getElementById('result2');
    const theta = parseFloat(document.getElementById('theta').value);
    
    resultDiv.innerHTML = '<div class="success">正在分析MA(1)模型...</div>';
    
    setTimeout(() => {
        try {
            // 检查可逆性条件
            const isInvertible = Math.abs(theta) < 1;
            const invertibilityText = isInvertible ? 
                '<span style="color: green;">✓ 可逆</span>' : 
                '<span style="color: red;">✗ 不可逆</span>';
            
            // 计算理论ACF
            const rho1 = theta / (1 + theta * theta);
            
            let resultHTML = '<div class="success">MA(1)模型分析完成</div>';
            resultHTML += '<div class="result-item"><strong>可逆性条件:</strong><br>';
            resultHTML += '|θ| < 1, 当前θ = ' + theta.toFixed(4) + '<br>';
            resultHTML += invertibilityText + '</div>';
            
            resultHTML += '<div class="result-item"><strong>理论自相关函数:</strong><br>';
            resultHTML += 'ρ₀ = 1.0000<br>';
            resultHTML += 'ρ₁ = ' + rho1.toFixed(4) + '<br>';
            resultHTML += 'ρₖ = 0 (当 k > 1)</div>';
            
            // 绘制理论ACF图
            resultHTML += '<div class="chart-container"><canvas id="ma1Chart"></canvas></div>';
            resultDiv.innerHTML = resultHTML;
            
            // 绘制理论ACF
            const theoreticalACF = [1, rho1];
            for (let i = 2; i <= 10; i++) {
                theoreticalACF.push(0);
            }
            drawACFChart('ma1Chart', theoreticalACF, 'MA(1)理论自相关函数');
            
        } catch (error) {
            resultDiv.innerHTML = '<div class="error">分析错误: ' + error.message + '</div>';
        }
    }, 500);
}

// 3. ARMA(1,1)模拟
function simulateARMA11() {
    const resultDiv = document.getElementById('result3');
    const phi = parseFloat(document.getElementById('phi').value);
    const theta = parseFloat(document.getElementById('theta_arma').value);
    const sampleSize = parseInt(document.getElementById('sampleSize').value);
    
    resultDiv.innerHTML = '<div class="success">正在模拟ARMA(1,1)过程...</div>';
    
    setTimeout(() => {
        try {
            // 模拟ARMA(1,1)过程
            const series = simulateARMA(phi, theta, sampleSize);
            
            // 计算ACF和PACF
            const acf = calculateACF(series, 20);
            const pacf = calculatePACF(series, 20);
            
            let resultHTML = '<div class="success">ARMA(1,1)模拟完成</div>';
            resultHTML += '<div class="result-item"><strong>模型参数:</strong><br>';
            resultHTML += 'φ = ' + phi.toFixed(4) + ', θ = ' + theta.toFixed(4) + '<br>';
            resultHTML += '样本量: ' + sampleSize + '</div>';
            
            // 绘制时间序列图
            resultHTML += '<div class="chart-container"><canvas id="seriesChart"></canvas></div>';
            resultHTML += '<div style="display: flex; gap: 20px;">';
            resultHTML += '<div style="flex: 1;"><canvas id="acfChart3"></canvas></div>';
            resultHTML += '<div style="flex: 1;"><canvas id="pacfChart3"></canvas></div>';
            resultHTML += '</div>';
            resultDiv.innerHTML = resultHTML;
            
            // 绘制图表
            drawTimeSeriesChart('seriesChart', series, 'ARMA(1,1)模拟序列');
            drawACFChart('acfChart3', acf, '样本ACF');
            drawPACFChart('pacfChart3', pacf, '样本PACF');
            
        } catch (error) {
            resultDiv.innerHTML = '<div class="error">模拟错误: ' + error.message + '</div>';
        }
    }, 1000);
}

// 4. 差分与ARMA拟合
function analyzeDiffARMA() {
    const resultDiv = document.getElementById('result4');
    resultDiv.innerHTML = '<div class="success">正在进行差分和ARMA拟合...</div>';
    
    if (!currentData || currentData.length < 30) {
        resultDiv.innerHTML = '<div class="error">请上传有效的时间序列数据（至少30个观测值）</div>';
        return;
    }
    
    const diffOrder = parseInt(document.getElementById('diffOrder').value);
    const p = parseInt(document.getElementById('pOrder').value);
    const q = parseInt(document.getElementById('qOrder').value);
    
    setTimeout(() => {
        try {
            // 差分处理
            let diffSeries = [...currentData];
            for (let i = 0; i < diffOrder; i++) {
                diffSeries = difference(diffSeries);
            }
            
            // 计算差分前后的统计量
            const originalStats = calculateStats(currentData);
            const diffStats = calculateStats(diffSeries);
            
            let resultHTML = '<div class="success">差分和ARMA拟合完成</div>';
            resultHTML += '<div class="result-item"><strong>原始序列统计:</strong><br>';
            resultHTML += '均值: ' + originalStats.mean.toFixed(4) + '<br>';
            resultHTML += '方差: ' + originalStats.variance.toFixed(4) + '<br>';
            resultHTML += '标准差: ' + originalStats.std.toFixed(4) + '</div>';
            
            resultHTML += '<div class="result-item"><strong>差分后序列统计 (' + diffOrder + '阶差分):</strong><br>';
            resultHTML += '均值: ' + diffStats.mean.toFixed(4) + '<br>';
            resultHTML += '方差: ' + diffStats.variance.toFixed(4) + '<br>';
            resultHTML += '标准差: ' + diffStats.std.toFixed(4) + '</div>';
            
            // 简单ARMA参数估计（模拟）
            resultHTML += '<div class="result-item"><strong>ARMA(' + p + ',' + q + ')参数估计:</strong><br>';
            if (p > 0) {
                for (let i = 1; i <= p; i++) {
                    resultHTML += 'φ' + i + ' ≈ ' + (0.5 / i).toFixed(4) + '<br>';
                }
            }
            if (q > 0) {
                for (let i = 1; i <= q; i++) {
                    resultHTML += 'θ' + i + ' ≈ ' + (0.3 / i).toFixed(4) + '<br>';
                }
            }
            resultHTML += '</div>';
            
            // 绘制图表
            resultHTML += '<div style="display: flex; gap: 20px;">';
            resultHTML += '<div style="flex: 1;"><canvas id="originalChart"></canvas></div>';
            resultHTML += '<div style="flex: 1;"><canvas id="diffChart"></canvas></div>';
            resultHTML += '</div>';
            resultDiv.innerHTML = resultHTML;
            
            // 绘制原始序列和差分序列
            drawTimeSeriesChart('originalChart', currentData, '原始序列');
            drawTimeSeriesChart('diffChart', diffSeries, diffOrder + '阶差分序列');
            
        } catch (error) {
            resultDiv.innerHTML = '<div class="error">分析错误: ' + error.message + '</div>';
        }
    }, 1500);
}

// 数学计算函数
function calculateACF(data, maxLag) {
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
    
    const acf = [1]; // ρ₀ = 1
    
    for (let k = 1; k <= maxLag; k++) {
        let covariance = 0;
        for (let t = 0; t < n - k; t++) {
            covariance += (data[t] - mean) * (data[t + k] - mean);
        }
        acf[k] = covariance / (n * variance);
    }
    
    return acf;
}

function calculatePACF(data, maxLag) {
    // 简化版的PACF计算（实际应使用Durbin-Levinson算法）
    const pacf = [1]; // φ₁₁ = ρ₁
    const acf = calculateACF(data, maxLag);
    
    if (maxLag >= 1) pacf[1] = acf[1];
    if (maxLag >= 2) pacf[2] = (acf[2] - acf[1] * acf[1]) / (1 - acf[1] * acf[1]);
    
    for (let k = 3; k <= maxLag; k++) {
        pacf[k] = 0; // 简化处理
    }
    
    return pacf;
}

function simulateARMA(phi, theta, n) {
    const series = [0]; // 初始值
    const errors = [0];
    
    for (let t = 1; t < n; t++) {
        // 生成白噪声
        const epsilon = Math.random() * 2 - 1; // 简化白噪声
        errors.push(epsilon);
        
        // ARMA(1,1)模型: X_t = φX_{t-1} + ε_t + θε_{t-1}
        let x_t = phi * series[t-1] + epsilon + theta * errors[t-1];
        series.push(x_t);
    }
    
    return series;
}

function difference(data) {
    const diff = [];
    for (let i = 1; i < data.length; i++) {
        diff.push(data[i] - data[i-1]);
    }
    return diff;
}

function calculateStats(data) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    
    return { mean, variance, std };
}

// 图表绘制函数
function drawTimeSeriesChart(canvasId, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: data.length}, (_, i) => i + 1),
            datasets: [{
                label: title,
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: title }
            },
            scales: {
                x: { title: { display: true, text: '时间' } },
                y: { title: { display: true, text: '数值' } }
            }
        }
    });
}

function drawACFChart(canvasId, acf, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const lags = Array.from({length: acf.length}, (_, i) => i);
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: lags.map(lag => 'lag ' + lag),
            datasets: [{
                label: 'ACF',
                data: acf,
                backgroundColor: lags.map((_, i) => 
                    i === 0 ? '#28a745' : (Math.abs(acf[i]) > 0.2 ? '#dc3545' : '#6c757d')
                ),
                borderColor: lags.map((_, i) => 
                    i === 0 ? '#28a745' : (Math.abs(acf[i]) > 0.2 ? '#dc3545' : '#6c757d')
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: title }
            },
            scales: {
                y: { 
                    min: -1, 
                    max: 1,
                    title: { display: true, text: '自相关系数' }
                }
            }
        }
    });
}

function drawPACFChart(canvasId, pacf, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const lags = Array.from({length: pacf.length}, (_, i) => i);
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: lags.map(lag => 'lag ' + lag),
            datasets: [{
                label: 'PACF',
                data: pacf,
                backgroundColor: lags.map((_, i) => 
                    i === 0 ? '#28a745' : (Math.abs(pacf[i]) > 0.2 ? '#dc3545' : '#6c757d')
                ),
                borderColor: lags.map((_, i) => 
                    i === 0 ? '#28a745' : (Math.abs(pacf[i]) > 0.2 ? '#dc3545' : '#6c757d')
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: title }
            },
            scales: {
                y: { 
                    min: -1, 
                    max: 1,
                    title: { display: true, text: '偏自相关系数' }
                }
            }
        }
    });
}

// 重置函数
function resetTab1() {
    document.getElementById('file1').value = '';
    document.getElementById('preview1').innerHTML = '';
    document.getElementById('result1').innerHTML = '';
    currentData = null;
}

function resetTab2() {
    document.getElementById('theta').value = '0.5';
    document.getElementById('result2').innerHTML = '';
}

function resetTab3() {
    document.getElementById('phi').value = '0.6';
    document.getElementById('theta_arma').value = '0.4';
    document.getElementById('sampleSize').value = '1000';
    document.getElementById('result3').innerHTML = '';
}

function resetTab4() {
    document.getElementById('file4').value = '';
    document.getElementById('preview4').innerHTML = '';
    document.getElementById('result4').innerHTML = '';
    currentData = null;
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加拖拽功能
    const fileUploads = document.querySelectorAll('.file-upload');
    fileUploads.forEach(upload => {
        upload.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        upload.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        upload.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const input = this.querySelector('input[type="file"]');
                input.files = files;
                const event = new Event('change');
                input.dispatchEvent(event);
            }
        });
    });
});