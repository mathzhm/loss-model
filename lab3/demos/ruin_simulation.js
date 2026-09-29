// 盈余过程模拟JavaScript代码

class RuinSimulation {
    constructor() {
        this.simulationResults = null;
    }

    // 生成随机数
    static randomExponential(lambda) {
        return -Math.log(Math.random()) / lambda;
    }

    static randomGamma(alpha, beta) {
        // 使用Marsaglia and Tsang方法生成伽马分布随机数
        if (alpha < 1) {
            return this.randomGamma(alpha + 1, beta) * Math.pow(Math.random(), 1/alpha);
        }
        
        const d = alpha - 1/3;
        const c = 1 / Math.sqrt(9 * d);
        
        while (true) {
            let x, v;
            do {
                x = this.randomNormal(0, 1);
                v = 1 + c * x;
            } while (v <= 0);
            
            v = v * v * v;
            const u = Math.random();
            
            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v / beta;
            }
            
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v / beta;
            }
        }
    }

    static randomLognormal(mu, sigma) {
        const normal = this.randomNormal(mu, sigma);
        return Math.exp(normal);
    }

    static randomNormal(mu = 0, sigma = 1) {
        // Box-Muller变换
        if (this.spare !== undefined) {
            const tmp = this.spare;
            delete this.spare;
            return tmp * sigma + mu;
        }
        
        const u = Math.random();
        const v = Math.random();
        const mag = sigma * Math.sqrt(-2 * Math.log(u));
        this.spare = mag * Math.cos(2 * Math.PI * v);
        return mag * Math.sin(2 * Math.PI * v) + mu;
    }

    // 生成索赔额
    generateClaimAmount(distribution, param1, param2) {
        switch (distribution) {
            case 'exponential':
                return RuinSimulation.randomExponential(param1);
            case 'gamma':
                return RuinSimulation.randomGamma(param1, param2);
            case 'lognormal':
                return RuinSimulation.randomLognormal(param1, param2);
            default:
                return RuinSimulation.randomExponential(1);
        }
    }

    // 模拟单条盈余路径
    simulateSinglePath(u, c, lambda, timeHorizon, claimDistribution, param1, param2) {
        const path = [{t: 0, surplus: u, claims: 0}];
        let currentSurplus = u;
        let totalClaims = 0;
        let ruinTime = null;
        
        for (let t = 1; t <= timeHorizon; t++) {
            // 生成该时期的索赔次数（泊松分布）
            const numClaims = this.randomPoisson(lambda);
            
            // 生成索赔额
            let periodClaims = 0;
            for (let i = 0; i < numClaims; i++) {
                periodClaims += this.generateClaimAmount(claimDistribution, param1, param2);
            }
            
            // 更新盈余
            currentSurplus = currentSurplus + c - periodClaims;
            totalClaims += periodClaims;
            
            path.push({
                t: t,
                surplus: currentSurplus,
                claims: totalClaims,
                periodClaims: periodClaims,
                numClaims: numClaims
            });
            
            // 检查是否破产
            if (currentSurplus < 0 && ruinTime === null) {
                ruinTime = t;
            }
        }
        
        return {
            path: path,
            ruinTime: ruinTime,
            finalSurplus: currentSurplus
        };
    }

    // 生成泊松随机数
    randomPoisson(lambda) {
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        
        return k - 1;
    }

    // 运行多次模拟
    runMultipleSimulations(params) {
        const {
            initialReserve,
            premiumRate,
            claimFrequency,
            timeHorizon,
            numSimulations,
            claimDistribution,
            param1,
            param2
        } = params;

        const results = {
            paths: [],
            ruinTimes: [],
            finalSurpluses: [],
            ruinProbability: 0,
            averageRuinTime: 0,
            statistics: {}
        };

        // 运行模拟
        for (let i = 0; i < numSimulations; i++) {
            const simulation = this.simulateSinglePath(
                initialReserve,
                premiumRate,
                claimFrequency,
                timeHorizon,
                claimDistribution,
                param1,
                param2
            );

            if (i < 20) { // 只保存前20条路径用于显示
                results.paths.push(simulation.path);
            }

            if (simulation.ruinTime !== null) {
                results.ruinTimes.push(simulation.ruinTime);
            }

            results.finalSurpluses.push(simulation.finalSurplus);
        }

        // 计算统计量
        results.ruinProbability = results.ruinTimes.length / numSimulations;
        results.averageRuinTime = results.ruinTimes.length > 0 
            ? results.ruinTimes.reduce((a, b) => a + b, 0) / results.ruinTimes.length 
            : null;

        results.statistics = this.calculateStatistics(results);
        
        this.simulationResults = results;
        return results;
    }

    // 计算统计量
    calculateStatistics(results) {
        const finalSurpluses = results.finalSurpluses;
        const ruinTimes = results.ruinTimes;

        const stats = {
            meanFinalSurplus: finalSurpluses.reduce((a, b) => a + b, 0) / finalSurpluses.length,
            stdFinalSurplus: 0,
            minFinalSurplus: Math.min(...finalSurpluses),
            maxFinalSurplus: Math.max(...finalSurpluses),
            ruinTimeStats: {}
        };

        // 计算标准差
        const variance = finalSurpluses.reduce((acc, val) => 
            acc + Math.pow(val - stats.meanFinalSurplus, 2), 0) / finalSurpluses.length;
        stats.stdFinalSurplus = Math.sqrt(variance);

        // 破产时间统计
        if (ruinTimes.length > 0) {
            stats.ruinTimeStats = {
                mean: ruinTimes.reduce((a, b) => a + b, 0) / ruinTimes.length,
                min: Math.min(...ruinTimes),
                max: Math.max(...ruinTimes),
                median: this.calculateMedian(ruinTimes)
            };
        }

        return stats;
    }

    calculateMedian(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
}

// 全局变量
let simulation = new RuinSimulation();

// 获取参数
function getParameters() {
    return {
        initialReserve: parseFloat(document.getElementById('initial-reserve').value),
        premiumRate: parseFloat(document.getElementById('premium-rate').value),
        claimFrequency: parseFloat(document.getElementById('claim-frequency').value),
        timeHorizon: parseInt(document.getElementById('time-horizon').value),
        numSimulations: parseInt(document.getElementById('num-simulations').value),
        claimDistribution: document.getElementById('claim-distribution').value,
        param1: parseFloat(document.getElementById('claim-param1').value),
        param2: parseFloat(document.getElementById('claim-param2').value)
    };
}

// 运行模拟
function runSimulation() {
    const params = getParameters();
    
    // 显示加载状态
    document.querySelector('.simulate-btn').textContent = '模拟中...';
    document.querySelector('.simulate-btn').disabled = true;
    
    // 使用setTimeout让UI有时间更新
    setTimeout(() => {
        const results = simulation.runMultipleSimulations(params);
        
        // 更新结果显示
        updateResults(results);
        
        // 绘制图形
        plotSurplusPaths(results);
        plotRuinTimeDistribution(results);
        plotAnalysis(results);
        
        // 恢复按钮状态
        document.querySelector('.simulate-btn').textContent = '开始模拟';
        document.querySelector('.simulate-btn').disabled = false;
    }, 100);
}

// 更新结果显示
function updateResults(results) {
    const resultsContainer = document.getElementById('results');
    
    resultsContainer.innerHTML = `
        <div class="result-item">
            <div class="value">${(results.ruinProbability * 100).toFixed(2)}%</div>
            <div class="label">破产概率</div>
        </div>
        <div class="result-item">
            <div class="value">${results.averageRuinTime ? results.averageRuinTime.toFixed(2) : 'N/A'}</div>
            <div class="label">平均破产时间</div>
        </div>
        <div class="result-item">
            <div class="value">${results.statistics.meanFinalSurplus.toFixed(2)}</div>
            <div class="label">平均最终盈余</div>
        </div>
        <div class="result-item">
            <div class="value">${results.ruinTimes.length}</div>
            <div class="label">破产次数</div>
        </div>
    `;
}

// 绘制盈余路径
function plotSurplusPaths(results) {
    const traces = [];
    
    // 绘制多条路径
    results.paths.forEach((path, index) => {
        const x = path.map(p => p.t);
        const y = path.map(p => p.surplus);
        const isRuined = y.some(val => val < 0);
        
        traces.push({
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            name: `路径 ${index + 1}`,
            line: {
                color: isRuined ? '#ff6b6b' : '#4facfe',
                width: isRuined ? 2 : 1,
                opacity: isRuined ? 0.8 : 0.6
            },
            showlegend: false
        });
    });
    
    // 添加破产线
    traces.push({
        x: [0, Math.max(...results.paths[0].map(p => p.t))],
        y: [0, 0],
        type: 'scatter',
        mode: 'lines',
        name: '破产线',
        line: {
            color: 'red',
            width: 2,
            dash: 'dash'
        }
    });
    
    const layout = {
        title: {
            text: '盈余路径模拟',
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: '时间 t',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: '盈余 U(t)',
            gridcolor: '#e9ecef'
        },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: 'white',
        margin: { t: 60, r: 30, b: 60, l: 60 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true
    };
    
    Plotly.newPlot('surplus-paths-plot', traces, layout, config);
}

// 绘制破产时间分布
function plotRuinTimeDistribution(results) {
    if (results.ruinTimes.length === 0) {
        document.getElementById('ruin-time-plot').innerHTML = 
            '<div style="text-align: center; padding: 50px; color: #6c757d;">没有发生破产事件</div>';
        return;
    }
    
    const trace = {
        x: results.ruinTimes,
        type: 'histogram',
        nbinsx: 20,
        name: '破产时间分布',
        marker: {
            color: '#ff6b6b',
            opacity: 0.7
        }
    };
    
    const layout = {
        title: {
            text: '破产时间分布',
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: '破产时间',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: '频数',
            gridcolor: '#e9ecef'
        },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: 'white',
        margin: { t: 60, r: 30, b: 60, l: 60 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true
    };
    
    Plotly.newPlot('ruin-time-plot', [trace], layout, config);
}

// 绘制统计分析
function plotAnalysis(results) {
    const trace = {
        x: results.finalSurpluses,
        type: 'histogram',
        nbinsx: 30,
        name: '最终盈余分布',
        marker: {
            color: '#4facfe',
            opacity: 0.7
        }
    };
    
    const layout = {
        title: {
            text: '最终盈余分布',
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: '最终盈余',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: '频数',
            gridcolor: '#e9ecef'
        },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: 'white',
        margin: { t: 60, r: 30, b: 60, l: 60 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true
    };
    
    Plotly.newPlot('analysis-plot', [trace], layout, config);
}

// 切换标签页
function switchTab(tabName) {
    // 移除所有active类
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // 添加active类到选中的标签页
    event.target.classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
}

// 更新分布参数标签
function updateParameterLabels() {
    const distribution = document.getElementById('claim-distribution').value;
    const param1Label = document.querySelector('label[for="claim-param1"]');
    const param2Label = document.querySelector('label[for="claim-param2"]');
    const param2Input = document.getElementById('claim-param2');
    
    switch (distribution) {
        case 'exponential':
            param1Label.textContent = '率参数 (λ):';
            param2Label.textContent = '参数2 (未使用):';
            param2Input.style.display = 'none';
            param2Label.style.display = 'none';
            break;
        case 'gamma':
            param1Label.textContent = '形状参数 (α):';
            param2Label.textContent = '率参数 (β):';
            param2Input.style.display = 'block';
            param2Label.style.display = 'block';
            break;
        case 'lognormal':
            param1Label.textContent = '均值参数 (μ):';
            param2Label.textContent = '标准差参数 (σ):';
            param2Input.style.display = 'block';
            param2Label.style.display = 'block';
            break;
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 分布选择变化事件
    document.getElementById('claim-distribution').addEventListener('change', updateParameterLabels);
    
    // 初始化参数标签
    updateParameterLabels();
    
    // 等待MathJax加载完成
    if (window.MathJax) {
        MathJax.startup.promise.then(() => {
            MathJax.typesetPromise();
        });
    }
});