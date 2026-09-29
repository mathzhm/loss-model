// (a,b,0)类分布理论与应用JavaScript代码

class AB0Distributions {
    constructor() {
        this.currentSection = 'recursion';
    }

    // 数学函数
    static factorial(n) {
        if (n <= 1) return 1;
        return n * this.factorial(n - 1);
    }

    static gamma(z) {
        // Lanczos近似
        const g = 7;
        const C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        
        if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
        
        z -= 1;
        let x = C[0];
        for (let i = 1; i < g + 2; i++) {
            x += C[i] / (z + i);
        }
        
        const t = z + g + 0.5;
        const sqrt2pi = Math.sqrt(2 * Math.PI);
        return sqrt2pi * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
    }

    static binomialCoeff(n, k) {
        if (k > n || k < 0) return 0;
        if (k === 0 || k === n) return 1;
        
        // 使用伽马函数计算广义二项式系数
        return this.gamma(n + 1) / (this.gamma(k + 1) * this.gamma(n - k + 1));
    }

    // 概率分布函数
    static poissonPMF(k, lambda) {
        return Math.pow(lambda, k) * Math.exp(-lambda) / this.factorial(k);
    }

    static binomialPMF(k, n, p) {
        return this.binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }

    static negativeBinomialPMF(k, r, p) {
        const coeff = this.gamma(k + r) / (this.gamma(r) * this.gamma(k + 1));
        return coeff * Math.pow(p, r) * Math.pow(1 - p, k);
    }

    static normalPDF(x, mu, sigma) {
        const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
        const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
        return coefficient * Math.exp(exponent);
    }

    // 随机数生成
    static randomPoisson(lambda) {
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        
        return k - 1;
    }

    static randomGamma(alpha, beta) {
        // Marsaglia and Tsang方法
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

    static randomNormal(mu = 0, sigma = 1) {
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
}

// 递推公式计算
function calculateRecursion() {
    const a = parseFloat(document.getElementById('param-a').value);
    const b = parseFloat(document.getElementById('param-b').value);
    const p0 = parseFloat(document.getElementById('p0').value);
    const maxK = parseInt(document.getElementById('max-k').value);

    const probabilities = [p0];
    const ratios = [];
    
    // 计算递推序列
    for (let k = 1; k <= maxK; k++) {
        const ratio = a + b / k;
        ratios.push(ratio);
        const pk = probabilities[k - 1] * ratio;
        probabilities.push(pk);
    }

    // 显示计算步骤
    displayRecursionSteps(a, b, probabilities, ratios, maxK);
    
    // 绘制图形
    plotRecursionResults(probabilities, ratios);
}

function displayRecursionSteps(a, b, probabilities, ratios, maxK) {
    const container = document.getElementById('recursion-steps');
    let html = '<h4>计算步骤：</h4>';
    
    html += `<div class="step">
        <span class="step-number">0</span>
        <strong>初始条件：</strong> p₀ = ${probabilities[0].toFixed(6)}
    </div>`;
    
    for (let k = 1; k <= Math.min(maxK, 5); k++) {
        html += `<div class="step">
            <span class="step-number">${k}</span>
            <strong>k = ${k}：</strong><br>
            比值：$\\frac{p_${k}}{p_{${k-1}}} = ${a} + \\frac{${b}}{${k}} = ${ratios[k-1].toFixed(4)}$<br>
            概率：$p_${k} = p_{${k-1}} \\times ${ratios[k-1].toFixed(4)} = ${probabilities[k].toFixed(6)}$
        </div>`;
    }
    
    if (maxK > 5) {
        html += `<div class="step">
            <span class="step-number">...</span>
            <strong>继续计算到 k = ${maxK}</strong>
        </div>`;
    }
    
    container.innerHTML = html;
    
    // 重新渲染MathJax
    if (window.MathJax) {
        MathJax.typesetPromise([container]);
    }
}

function plotRecursionResults(probabilities, ratios) {
    const k_values = Array.from({length: probabilities.length}, (_, i) => i);
    
    // 概率图
    const trace1 = {
        x: k_values,
        y: probabilities,
        type: 'scatter',
        mode: 'lines+markers',
        name: '概率 p_k',
        line: { color: '#667eea', width: 3 },
        marker: { size: 8 }
    };
    
    // 比值图
    const trace2 = {
        x: k_values.slice(1),
        y: ratios,
        type: 'scatter',
        mode: 'lines+markers',
        name: '比值 p_k/p_{k-1}',
        line: { color: '#ff6b6b', width: 3 },
        marker: { size: 8 },
        yaxis: 'y2'
    };
    
    const layout = {
        title: {
            text: '递推公式计算结果',
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: 'k',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: '概率 p_k',
            gridcolor: '#e9ecef',
            side: 'left'
        },
        yaxis2: {
            title: '比值 p_k/p_{k-1}',
            overlaying: 'y',
            side: 'right',
            gridcolor: '#e9ecef'
        },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: 'white',
        margin: { t: 60, r: 60, b: 60, l: 60 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true
    };
    
    Plotly.newPlot('recursion-plot', [trace1, trace2], layout, config);
}

// 分布识别
function identifyDistribution() {
    const a = parseFloat(document.getElementById('identify-a').value);
    const b = parseFloat(document.getElementById('identify-b').value);
    
    let distributionType = '';
    let parameters = '';
    let characteristics = '';
    
    if (Math.abs(a) < 0.001) {
        // 泊松分布
        distributionType = '泊松分布 (Poisson)';
        parameters = `λ = ${b.toFixed(3)}`;
        characteristics = `均值 = 方差 = ${b.toFixed(3)}`;
    } else if (a > 0) {
        // 负二项分布
        distributionType = '负二项分布 (Negative Binomial)';
        const p = 1 / (1 + a);
        const r = b * p / a + 1;
        parameters = `r ≈ ${r.toFixed(3)}, p ≈ ${p.toFixed(3)}`;
        const mean = r * (1 - p) / p;
        const variance = r * (1 - p) / (p * p);
        characteristics = `均值 ≈ ${mean.toFixed(3)}, 方差 ≈ ${variance.toFixed(3)} (过度离散)`;
    } else {
        // 二项分布
        distributionType = '二项分布 (Binomial)';
        const p_est = -a / (1 - a);
        const n_est = b / (-a) - 1;
        parameters = `n ≈ ${n_est.toFixed(0)}, p ≈ ${p_est.toFixed(3)}`;
        const mean = n_est * p_est;
        const variance = n_est * p_est * (1 - p_est);
        characteristics = `均值 ≈ ${mean.toFixed(3)}, 方差 ≈ ${variance.toFixed(3)} (欠度离散)`;
    }
    
    const resultsContainer = document.getElementById('identification-results');
    resultsContainer.innerHTML = `
        <div class="result-item">
            <div class="value">${distributionType}</div>
            <div class="label">识别的分布类型</div>
        </div>
        <div class="result-item">
            <div class="value">${parameters}</div>
            <div class="label">估计参数</div>
        </div>
        <div class="result-item">
            <div class="value">${characteristics}</div>
            <div class="label">分布特征</div>
        </div>
    `;
}

// 泊松分布可加性演示
function demonstratePoissonAdditivity() {
    const lambda1 = parseFloat(document.getElementById('lambda1').value);
    const lambda2 = parseFloat(document.getElementById('lambda2').value);
    const sampleSize = parseInt(document.getElementById('sample-size').value);
    
    // 生成样本
    const samples1 = [];
    const samples2 = [];
    const samplesSum = [];
    
    for (let i = 0; i < sampleSize; i++) {
        const x1 = AB0Distributions.randomPoisson(lambda1);
        const x2 = AB0Distributions.randomPoisson(lambda2);
        samples1.push(x1);
        samples2.push(x2);
        samplesSum.push(x1 + x2);
    }
    
    // 理论分布
    const maxK = Math.max(...samplesSum) + 5;
    const k_values = Array.from({length: maxK + 1}, (_, i) => i);
    
    const theoretical1 = k_values.map(k => AB0Distributions.poissonPMF(k, lambda1));
    const theoretical2 = k_values.map(k => AB0Distributions.poissonPMF(k, lambda2));
    const theoreticalSum = k_values.map(k => AB0Distributions.poissonPMF(k, lambda1 + lambda2));
    
    // 绘制比较图
    plotPoissonAdditivity(k_values, theoretical1, theoretical2, theoreticalSum, 
                         samplesSum, lambda1, lambda2);
}

function plotPoissonAdditivity(k_values, theoretical1, theoretical2, theoreticalSum, 
                              samplesSum, lambda1, lambda2) {
    // 计算经验分布
    const counts = {};
    samplesSum.forEach(x => counts[x] = (counts[x] || 0) + 1);
    const empirical = k_values.map(k => (counts[k] || 0) / samplesSum.length);
    
    const traces = [
        {
            x: k_values,
            y: theoretical1,
            type: 'scatter',
            mode: 'lines+markers',
            name: `Poisson(${lambda1})`,
            line: { color: '#4facfe', width: 2 }
        },
        {
            x: k_values,
            y: theoretical2,
            type: 'scatter',
            mode: 'lines+markers',
            name: `Poisson(${lambda2})`,
            line: { color: '#ff6b6b', width: 2 }
        },
        {
            x: k_values,
            y: theoreticalSum,
            type: 'scatter',
            mode: 'lines+markers',
            name: `理论和: Poisson(${lambda1 + lambda2})`,
            line: { color: '#28a745', width: 3 }
        },
        {
            x: k_values,
            y: empirical,
            type: 'scatter',
            mode: 'markers',
            name: '经验分布',
            marker: { color: '#ffc107', size: 8, symbol: 'diamond' }
        }
    ];
    
    const layout = {
        title: {
            text: '泊松分布可加性验证',
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: 'k',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: '概率',
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
    
    Plotly.newPlot('poisson-additivity-plot', traces, layout, config);
}

// 负二项分布混合泊松演示
function demonstrateNegativeBinomial() {
    const r = parseFloat(document.getElementById('gamma-r').value);
    const beta = parseFloat(document.getElementById('gamma-beta').value);
    const numSamples = parseInt(document.getElementById('nb-samples').value);
    
    // 混合泊松模拟
    const mixedSamples = [];
    for (let i = 0; i < numSamples; i++) {
        const lambda = AB0Distributions.randomGamma(r, beta);
        const x = AB0Distributions.randomPoisson(lambda);
        mixedSamples.push(x);
    }
    
    // 计算负二项分布参数
    const p = beta / (beta + 1);
    
    // 理论负二项分布
    const maxK = Math.max(...mixedSamples) + 5;
    const k_values = Array.from({length: maxK + 1}, (_, i) => i);
    const theoretical = k_values.map(k => AB0Distributions.negativeBinomialPMF(k, r, p));
    
    // 计算统计量
    const sampleMean = mixedSamples.reduce((a, b) => a + b, 0) / mixedSamples.length;
    const sampleVar = mixedSamples.reduce((acc, x) => acc + Math.pow(x - sampleMean, 2), 0) / mixedSamples.length;
    const theoreticalMean = r * (1 - p) / p;
    const theoreticalVar = r * (1 - p) / (p * p);
    
    // 更新结果显示
    document.getElementById('nb-results').innerHTML = `
        <div class="result-item">
            <div class="value">${sampleMean.toFixed(3)}</div>
            <div class="label">样本均值</div>
        </div>
        <div class="result-item">
            <div class="value">${theoreticalMean.toFixed(3)}</div>
            <div class="label">理论均值</div>
        </div>
        <div class="result-item">
            <div class="value">${sampleVar.toFixed(3)}</div>
            <div class="label">样本方差</div>
        </div>
        <div class="result-item">
            <div class="value">${theoreticalVar.toFixed(3)}</div>
            <div class="label">理论方差</div>
        </div>
        <div class="result-item">
            <div class="value">${p.toFixed(3)}</div>
            <div class="label">负二项参数 p</div>
        </div>
        <div class="result-item">
            <div class="value">${r.toFixed(3)}</div>
            <div class="label">负二项参数 r</div>
        </div>
    `;
    
    // 绘制比较图
    plotNegativeBinomial(k_values, theoretical, mixedSamples);
}

function plotNegativeBinomial(k_values, theoretical, samples) {
    // 计算经验分布
    const counts = {};
    samples.forEach(x => counts[x] = (counts[x] || 0) + 1);
    const empirical = k_values.map(k => (counts[k] || 0) / samples.length);
    
    const traces = [
        {
            x: k_values,
            y: theoretical,
            type: 'scatter',
            mode: 'lines+markers',
            name: '理论负二项分布',
            line: { color: '#667eea', width: 3 }
        },
        {
            x: k_values,
            y: empirical,
            type: 'scatter',
            mode: 'markers',
            name: '混合泊松样本',
            marker: { color: '#ff6b6b', size: 8, symbol: 'diamond' }
        }
    ];
    
    const layout = {
        title: {
            text: '混合泊松到负二项分布的转换',
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: 'k',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: '概率',
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
    
    Plotly.newPlot('negative-binomial-plot', traces, layout, config);
}

// 二项分布近似比较
function compareBinomialApproximations() {
    const n = parseInt(document.getElementById('binom-n').value);
    const p = parseFloat(document.getElementById('binom-p').value);
    
    const lambda = n * p;
    const mu = n * p;
    const sigma = Math.sqrt(n * p * (1 - p));
    
    // 计算适用性条件
    const poissonApplicable = n >= 30 && p <= 0.1 && lambda <= 5;
    const normalApplicable = mu >= 5 && n * (1 - p) >= 5;
    
    // 更新结果显示
    document.getElementById('approximation-results').innerHTML = `
        <div class="result-item">
            <div class="value">${lambda.toFixed(3)}</div>
            <div class="label">λ = np</div>
        </div>
        <div class="result-item">
            <div class="value">${mu.toFixed(3)}</div>
            <div class="label">μ = np</div>
        </div>
        <div class="result-item">
            <div class="value">${sigma.toFixed(3)}</div>
            <div class="label">σ = √(np(1-p))</div>
        </div>
        <div class="result-item">
            <div class="value">${poissonApplicable ? '✓' : '✗'}</div>
            <div class="label">泊松近似适用</div>
        </div>
        <div class="result-item">
            <div class="value">${normalApplicable ? '✓' : '✗'}</div>
            <div class="label">正态近似适用</div>
        </div>
    `;
    
    // 计算分布
    const maxK = Math.min(n, mu + 4 * sigma);
    const k_values = Array.from({length: maxK + 1}, (_, i) => i);
    
    const binomial = k_values.map(k => AB0Distributions.binomialPMF(k, n, p));
    const poisson = k_values.map(k => AB0Distributions.poissonPMF(k, lambda));
    const normal = k_values.map(k => AB0Distributions.normalPDF(k, mu, sigma));
    
    // 绘制比较图
    plotBinomialApproximations(k_values, binomial, poisson, normal, 
                              poissonApplicable, normalApplicable);
}

function plotBinomialApproximations(k_values, binomial, poisson, normal, 
                                   poissonApplicable, normalApplicable) {
    const traces = [
        {
            x: k_values,
            y: binomial,
            type: 'scatter',
            mode: 'lines+markers',
            name: '二项分布 (精确)',
            line: { color: '#2c3e50', width: 3 }
        }
    ];
    
    if (poissonApplicable) {
        traces.push({
            x: k_values,
            y: poisson,
            type: 'scatter',
            mode: 'lines',
            name: '泊松近似',
            line: { color: '#ff6b6b', width: 2, dash: 'dash' }
        });
    }
    
    if (normalApplicable) {
        traces.push({
            x: k_values,
            y: normal,
            type: 'scatter',
            mode: 'lines',
            name: '正态近似',
            line: { color: '#28a745', width: 2, dash: 'dot' }
        });
    }
    
    const layout = {
        title: {
            text: '二项分布近似比较',
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: 'k',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: '概率/密度',
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
    
    Plotly.newPlot('binomial-approximation-plot', traces, layout, config);
}

// 应用案例展示
function showApplicationCase() {
    const caseType = document.getElementById('case-type').value;
    const container = document.getElementById('case-analysis');
    
    let caseContent = '';
    
    switch (caseType) {
        case 'insurance':
            caseContent = `
                <div class="example-box">
                    <h4>保险理赔案例分析</h4>
                    <p><strong>背景：</strong>某保险公司需要分析年度理赔次数分布</p>
                    
                    <div class="step-by-step">
                        <div class="step">
                            <span class="step-number">1</span>
                            <strong>数据收集：</strong>收集历史理赔数据，计算递推比值
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <strong>分布识别：</strong>通过(a,b,0)递推关系识别分布类型
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <strong>参数估计：</strong>如果识别为负二项分布，说明存在过度离散
                        </div>
                        <div class="step">
                            <span class="step-number">4</span>
                            <strong>风险评估：</strong>使用混合泊松模型解释异质性
                        </div>
                    </div>
                    
                    <p><strong>实际意义：</strong>过度离散表明不同客户群体的理赔风险存在显著差异</p>
                </div>
            `;
            break;
            
        case 'finance':
            caseContent = `
                <div class="example-box">
                    <h4>金融违约风险案例</h4>
                    <p><strong>背景：</strong>银行需要评估贷款组合的违约风险</p>
                    
                    <div class="step-by-step">
                        <div class="step">
                            <span class="step-number">1</span>
                            <strong>单笔建模：</strong>每笔贷款违约服从伯努利分布
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <strong>组合风险：</strong>多笔贷款违约数服从二项分布
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <strong>近似计算：</strong>当违约率很低时，使用泊松近似
                        </div>
                        <div class="step">
                            <span class="step-number">4</span>
                            <strong>压力测试：</strong>在极端情况下评估尾部风险
                        </div>
                    </div>
                    
                    <p><strong>实际意义：</strong>泊松近似简化了大组合的风险计算</p>
                </div>
            `;
            break;
            
        case 'operations':
            caseContent = `
                <div class="example-box">
                    <h4>运营管理案例</h4>
                    <p><strong>背景：</strong>呼叫中心需要预测客户来电量</p>
                    
                    <div class="step-by-step">
                        <div class="step">
                            <span class="step-number">1</span>
                            <strong>基础建模：</strong>单位时间来电数服从泊松分布
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <strong>可加性应用：</strong>多个时段的来电数可以相加
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <strong>容量规划：</strong>基于泊松分布设计服务容量
                        </div>
                        <div class="step">
                            <span class="step-number">4</span>
                            <strong>异质性处理：</strong>如果存在过度离散，考虑负二项模型
                        </div>
                    </div>
                    
                    <p><strong>实际意义：</strong>准确的分布建模有助于优化资源配置</p>
                </div>
            `;
            break;
    }
    
    container.innerHTML = caseContent;
}

// 导航功能
function switchSection(sectionName) {
    // 隐藏所有section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 移除所有按钮的active类
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的section
    document.getElementById(sectionName).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 导航按钮点击事件
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });
    
    // 等待MathJax加载完成
    if (window.MathJax) {
        MathJax.startup.promise.then(() => {
            MathJax.typesetPromise();
        });
    }
    
    // 初始化第一个计算
    setTimeout(() => {
        calculateRecursion();
    }, 1000);
});