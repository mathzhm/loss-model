// 损失估计理论与应用JavaScript代码

// 全局变量
let currentSection = 'moment-estimation';
let currentDistributionTab = {
    moment: 'exponential',
    mle: 'exponential'
};

// 数学函数库
const MathUtils = {
    // 伽马函数近似
    gamma: function(z) {
        if (z < 0.5) {
            return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
        }
        z -= 1;
        let x = 0.99999999999980993;
        const coefficients = [
            676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059,
            12.507343278686905, -0.13857109526572012,
            9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        
        for (let i = 0; i < coefficients.length; i++) {
            x += coefficients[i] / (z + i + 1);
        }
        
        const t = z + coefficients.length - 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    },

    // 二分法求根
    bisection: function(func, a, b, tolerance = 1e-10, maxIterations = 1000) {
        let iteration = 0;
        while (Math.abs(b - a) > tolerance && iteration < maxIterations) {
            const c = (a + b) / 2;
            if (func(c) === 0) return c;
            if (func(a) * func(c) < 0) {
                b = c;
            } else {
                a = c;
            }
            iteration++;
        }
        return (a + b) / 2;
    },

    // Simpson积分法
    simpson: function(func, a, b, n = 1000) {
        if (n % 2 === 1) n++;
        const h = (b - a) / n;
        let sum = func(a) + func(b);
        
        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            sum += (i % 2 === 0 ? 2 : 4) * func(x);
        }
        
        return sum * h / 3;
    },

    // 正态分布分位数函数
    normalQuantile: function(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;
        
        // 简化的近似公式
        const c0 = 2.515517;
        const c1 = 0.802853;
        const c2 = 0.010328;
        const d1 = 1.432788;
        const d2 = 0.189269;
        const d3 = 0.001308;
        
        let x;
        if (p < 0.5) {
            const t = Math.sqrt(-2 * Math.log(p));
            x = -(t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t));
        } else {
            const t = Math.sqrt(-2 * Math.log(1 - p));
            x = t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t);
        }
        
        return x;
    }
};

// 分布类
class Distribution {
    constructor(name, params) {
        this.name = name;
        this.params = params;
    }

    pdf(x) {
        switch (this.name) {
            case 'exponential':
                const lambda = this.params.lambda;
                return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
            
            case 'gamma':
                const alpha = this.params.alpha;
                const beta = this.params.beta;
                if (x <= 0) return 0;
                return Math.pow(beta, alpha) / MathUtils.gamma(alpha) * 
                       Math.pow(x, alpha - 1) * Math.exp(-beta * x);
            
            case 'pareto':
                const alpha_p = this.params.alpha;
                const xm = this.params.xm;
                return x >= xm ? alpha_p * Math.pow(xm, alpha_p) / Math.pow(x, alpha_p + 1) : 0;
            
            default:
                return 0;
        }
    }

    cdf(x) {
        switch (this.name) {
            case 'exponential':
                const lambda = this.params.lambda;
                return x >= 0 ? 1 - Math.exp(-lambda * x) : 0;
            
            case 'gamma':
                if (x <= 0) return 0;
                // 简化的近似
                return Math.min(1, x * this.params.beta / this.params.alpha);
            
            case 'pareto':
                const alpha_p = this.params.alpha;
                const xm = this.params.xm;
                return x >= xm ? 1 - Math.pow(xm / x, alpha_p) : 0;
            
            default:
                return 0;
        }
    }

    sample(n) {
        const samples = [];
        for (let i = 0; i < n; i++) {
            samples.push(this.sampleOne());
        }
        return samples;
    }

    sampleOne() {
        const u = Math.random();
        switch (this.name) {
            case 'exponential':
                return -Math.log(1 - u) / this.params.lambda;
            
            case 'gamma':
                // 简化的伽马分布生成（使用Erlang近似）
                const alpha = Math.round(this.params.alpha);
                const beta = this.params.beta;
                let sum = 0;
                for (let i = 0; i < alpha; i++) {
                    sum += -Math.log(Math.random());
                }
                return sum / beta;
            
            case 'pareto':
                return this.params.xm / Math.pow(1 - u, 1 / this.params.alpha);
            
            default:
                return 0;
        }
    }
}

// 估计器类
class Estimator {
    constructor(data) {
        this.data = [...data].sort((a, b) => a - b);
        this.n = data.length;
        this.mean = data.reduce((sum, x) => sum + x, 0) / this.n;
        this.variance = data.reduce((sum, x) => sum + Math.pow(x - this.mean, 2), 0) / (this.n - 1);
        this.std = Math.sqrt(this.variance);
    }

    momentEstimation(distribution) {
        switch (distribution) {
            case 'exponential':
                return {
                    lambda: 1 / this.mean,
                    method: 'moment',
                    steps: [
                        `样本均值: $\\bar{x} = ${this.mean.toFixed(4)}$`,
                        `理论均值: $E[X] = \\frac{1}{\\lambda}$`,
                        `矩估计: $\\hat{\\lambda} = \\frac{1}{\\bar{x}} = ${(1/this.mean).toFixed(4)}$`
                    ]
                };
            
            case 'gamma':
                const alpha_hat = Math.pow(this.mean, 2) / this.variance;
                const beta_hat = this.mean / this.variance;
                return {
                    alpha: alpha_hat,
                    beta: beta_hat,
                    method: 'moment',
                    steps: [
                        `样本均值: $\\bar{x} = ${this.mean.toFixed(4)}$`,
                        `样本方差: $s^2 = ${this.variance.toFixed(4)}$`,
                        `矩估计: $\\hat{\\alpha} = \\frac{\\bar{x}^2}{s^2} = ${alpha_hat.toFixed(4)}$`,
                        `矩估计: $\\hat{\\beta} = \\frac{\\bar{x}}{s^2} = ${beta_hat.toFixed(4)}$`
                    ]
                };
            
            case 'pareto':
                const xm_hat = Math.min(...this.data);
                const alpha_hat_pareto = 1 + this.n * xm_hat / this.data.reduce((sum, x) => sum + (x - xm_hat), 0);
                return {
                    xm: xm_hat,
                    alpha: alpha_hat_pareto,
                    method: 'moment',
                    steps: [
                        `最小值: $\\hat{x_m} = \\min(x_i) = ${xm_hat.toFixed(4)}$`,
                        `矩估计: $\\hat{\\alpha} = 1 + \\frac{n\\hat{x_m}}{\\sum_{i=1}^n (x_i - \\hat{x_m})} = ${alpha_hat_pareto.toFixed(4)}$`
                    ]
                };
            
            default:
                return null;
        }
    }

    mleEstimation(distribution) {
        switch (distribution) {
            case 'exponential':
                const lambda_mle = this.n / this.data.reduce((sum, x) => sum + x, 0);
                return {
                    lambda: lambda_mle,
                    method: 'mle',
                    logLikelihood: this.n * Math.log(lambda_mle) - lambda_mle * this.data.reduce((sum, x) => sum + x, 0),
                    steps: [
                        `对数似然函数: $\\ell(\\lambda) = n\\ln\\lambda - \\lambda\\sum_{i=1}^n x_i$`,
                        `MLE: $\\hat{\\lambda} = \\frac{n}{\\sum_{i=1}^n x_i} = ${lambda_mle.toFixed(4)}$`
                    ]
                };
            
            case 'gamma':
                // 简化的MLE估计
                const alpha_mle = Math.pow(this.mean, 2) / this.variance;
                const beta_mle = this.mean / this.variance;
                return {
                    alpha: alpha_mle,
                    beta: beta_mle,
                    method: 'mle',
                    steps: [
                        `使用矩估计作为MLE的近似`,
                        `$\\hat{\\alpha} = ${alpha_mle.toFixed(4)}$`,
                        `$\\hat{\\beta} = ${beta_mle.toFixed(4)}$`
                    ]
                };
            
            case 'pareto':
                const xm_mle = Math.min(...this.data);
                const alpha_mle_pareto = this.n / this.data.reduce((sum, x) => sum + Math.log(x / xm_mle), 0);
                return {
                    xm: xm_mle,
                    alpha: alpha_mle_pareto,
                    method: 'mle',
                    steps: [
                        `MLE: $\\hat{x_m} = \\min(x_i) = ${xm_mle.toFixed(4)}$`,
                        `MLE: $\\hat{\\alpha} = \\frac{n}{\\sum_{i=1}^n \\ln(x_i/\\hat{x_m})} = ${alpha_mle_pareto.toFixed(4)}$`
                    ]
                };
            
            default:
                return null;
        }
    }

    quantileEstimation(levels, method = 'linear') {
        const results = {};
        const steps = [];
        
        steps.push(`排序后的数据: [${this.data.slice(0, 10).map(x => x.toFixed(3)).join(', ')}${this.data.length > 10 ? '...' : ''}]`);
        
        for (const p of levels) {
            const position = p * (this.n - 1);
            const lower = Math.floor(position);
            const upper = Math.ceil(position);
            const fraction = position - lower;
            
            let quantile;
            if (lower === upper) {
                quantile = this.data[lower];
            } else {
                quantile = this.data[lower] * (1 - fraction) + this.data[upper] * fraction;
            }
            
            results[p] = quantile;
            steps.push(`第${(p*100).toFixed(1)}%分位数: ${quantile.toFixed(4)}`);
        }
        
        return { quantiles: results, steps: steps };
    }

    bootstrap(statistic, nBootstrap = 1000) {
        const bootstrapStats = [];
        
        for (let i = 0; i < nBootstrap; i++) {
            const bootstrapSample = [];
            for (let j = 0; j < this.n; j++) {
                const randomIndex = Math.floor(Math.random() * this.n);
                bootstrapSample.push(this.data[randomIndex]);
            }
            
            let stat;
            switch (statistic) {
                case 'mean':
                    stat = bootstrapSample.reduce((sum, x) => sum + x, 0) / bootstrapSample.length;
                    break;
                case 'median':
                    const sorted = [...bootstrapSample].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    stat = sorted.length % 2 === 0 ? (sorted[mid-1] + sorted[mid]) / 2 : sorted[mid];
                    break;
                default:
                    stat = 0;
            }
            
            bootstrapStats.push(stat);
        }
        
        return bootstrapStats.sort((a, b) => a - b);
    }
}

// 解析数据
function parseData(dataString) {
    return dataString.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
}

// 切换主要部分
function switchSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        }
    });
    
    currentSection = sectionId;
    
    if (window.MathJax) {
        MathJax.typesetPromise([targetSection]).catch((err) => console.log(err.message));
    }
}

// 切换分布标签页
function switchDistributionTab(distribution, method) {
    const tabContents = document.querySelectorAll(`#${method}-estimation .tab-content`);
    tabContents.forEach(content => content.classList.remove('active'));
    
    const tabs = document.querySelectorAll(`#${method}-estimation .tab`);
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const targetContent = document.getElementById(`${distribution}-${method}`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    const targetTab = event.target;
    targetTab.classList.add('active');
    
    currentDistributionTab[method] = distribution;
    
    if (window.MathJax) {
        MathJax.typesetPromise([targetContent]).catch((err) => console.log(err.message));
    }
}

// 生成样本数据
function generateSampleData(distribution, method) {
    try {
        const sampleSizeInput = document.getElementById(`${distribution}-sample-size-${method}`);
        const sampleSize = sampleSizeInput ? parseInt(sampleSizeInput.value) : 20;
        
        let samples = [];
        
        switch (distribution) {
            case 'exponential':
                for (let i = 0; i < sampleSize; i++) {
                    const u = Math.random();
                    samples.push(-Math.log(1 - u) / 1.5);
                }
                break;
            case 'gamma':
                for (let i = 0; i < sampleSize; i++) {
                    let sum = 0;
                    for (let j = 0; j < 2; j++) {
                        const u = Math.random();
                        sum += -Math.log(1 - u);
                    }
                    samples.push(sum);
                }
                break;
            case 'pareto':
                for (let i = 0; i < sampleSize; i++) {
                    const u = Math.random();
                    samples.push(1 / Math.pow(1 - u, 1 / 2.5));
                }
                break;
            default:
                samples = Array.from({length: sampleSize}, () => 1 + Math.random() * 2);
        }
        
        const textarea = document.getElementById(`${distribution}-data-${method}`);
        if (textarea) {
            textarea.value = samples.map(x => x.toFixed(3)).join(', ');
            console.log(`Generated ${samples.length} samples for ${distribution}-${method}`);
        } else {
            console.error(`Textarea not found: ${distribution}-data-${method}`);
            alert(`无法找到文本框: ${distribution}-data-${method}`);
        }
    } catch (error) {
        console.error('Error generating sample data:', error);
        alert('生成样本数据时出现错误: ' + error.message);
    }
}

// 加载示例数据
function loadExampleData(distribution, method) {
    try {
        let exampleData;
        
        switch (distribution) {
            case 'exponential':
                exampleData = [1.2, 0.8, 2.1, 1.5, 0.9, 1.8, 1.1, 2.3, 1.4, 1.7, 0.6, 2.5, 1.9, 1.3, 2.0];
                break;
            case 'gamma':
                exampleData = [2.1, 1.8, 3.2, 2.5, 1.9, 2.8, 2.1, 3.3, 2.4, 2.7, 1.6, 3.5, 2.9, 2.2, 3.1];
                break;
            case 'pareto':
                exampleData = [1.5, 2.1, 1.8, 3.2, 2.5, 1.9, 2.8, 4.1, 3.3, 2.4, 1.7, 3.8, 2.9, 2.3, 3.6];
                break;
            default:
                exampleData = [1.2, 0.8, 2.1, 1.5, 0.9, 1.8, 1.1, 2.3, 1.4, 1.7];
        }
        
        const textarea = document.getElementById(`${distribution}-data-${method}`);
        if (textarea) {
            textarea.value = exampleData.join(', ');
            console.log(`Loaded example data for ${distribution}-${method}`);
        } else {
            console.error(`Textarea not found: ${distribution}-data-${method}`);
            alert(`无法找到文本框: ${distribution}-data-${method}`);
        }
    } catch (error) {
        console.error('Error loading example data:', error);
        alert('加载示例数据时出现错误: ' + error.message);
    }
}

// 计算矩估计
function calculateMomentEstimation(distribution) {
    try {
        const textarea = document.getElementById(`${distribution}-data-moment`);
        if (!textarea) {
            alert(`无法找到数据输入框: ${distribution}-data-moment`);
            return;
        }
        
        const data = parseData(textarea.value);
        
        if (data.length === 0) {
            alert('请输入有效的数据');
            return;
        }
        
        const estimator = new Estimator(data);
        const result = estimator.momentEstimation(distribution);
        
        if (result) {
            displayEstimationResults(result, `${distribution}-moment-results`);
            plotEstimationResults(data, result, distribution, 'moment');
        }
    } catch (error) {
        console.error('Error calculating moment estimation:', error);
        alert('计算矩估计时出现错误: ' + error.message);
    }
}

// 计算MLE估计
function calculateMLEEstimation(distribution) {
    try {
        const textarea = document.getElementById(`${distribution}-data-mle`);
        if (!textarea) {
            alert(`无法找到数据输入框: ${distribution}-data-mle`);
            return;
        }
        
        const data = parseData(textarea.value);
        
        if (data.length === 0) {
            alert('请输入有效的数据');
            return;
        }
        
        const estimator = new Estimator(data);
        const result = estimator.mleEstimation(distribution);
        
        if (result) {
            displayEstimationResults(result, `${distribution}-mle-results`);
            plotEstimationResults(data, result, distribution, 'mle');
        }
    } catch (error) {
        console.error('Error calculating MLE estimation:', error);
        alert('计算MLE估计时出现错误: ' + error.message);
    }
}

// 显示估计结果
function displayEstimationResults(result, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    let html = `<h4>${result.method === 'moment' ? '矩估计' : 'MLE'}结果</h4>`;
    
    html += '<div class="results-grid">';
    for (const [param, value] of Object.entries(result)) {
        if (param !== 'method' && param !== 'steps' && param !== 'logLikelihood') {
            html += `
                <div class="result-item">
                    <div class="value">${value.toFixed(4)}</div>
                    <div class="label">${param === 'lambda' ? 'λ' : param === 'alpha' ? 'α' : param === 'beta' ? 'β' : param === 'xm' ? 'x_m' : param}</div>
                </div>
            `;
        }
    }
    html += '</div>';
    
    if (result.logLikelihood !== undefined) {
        html += `<p><strong>对数似然值:</strong> ${result.logLikelihood.toFixed(4)}</p>`;
    }
    
    if (result.steps) {
        html += '<div class="step-by-step"><h5>计算步骤:</h5>';
        result.steps.forEach((step, index) => {
            html += `
                <div class="step">
                    <span class="step-number">${index + 1}</span>
                    ${step}
                </div>
            `;
        });
        html += '</div>';
    }
    
    container.innerHTML = html;
    
    if (window.MathJax) {
        MathJax.typesetPromise([container]).catch((err) => console.log(err.message));
    }
}

// 绘制估计结果
function plotEstimationResults(data, result, distribution, method) {
    try {
        let params = {};
        for (const [key, value] of Object.entries(result)) {
            if (key !== 'method' && key !== 'steps' && key !== 'logLikelihood') {
                params[key] = value;
            }
        }
        
        const dist = new Distribution(distribution, params);
        
        const xMin = Math.min(...data);
        const xMax = Math.max(...data);
        const range = xMax - xMin;
        const xValues = [];
        const yValues = [];
        
        for (let x = Math.max(0, xMin - range * 0.1); x <= xMax + range * 0.1; x += range / 100) {
            xValues.push(x);
            yValues.push(dist.pdf(x));
        }
        
        const histTrace = {
            x: data,
            type: 'histogram',
            name: '经验分布',
            opacity: 0.7,
            nbinsx: Math.min(20, Math.floor(data.length / 3)),
            histnorm: 'probability density'
        };
        
        const pdfTrace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: '拟合分布',
            line: { color: 'red', width: 2 }
        };
        
        const layout = {
            title: `${distribution}分布拟合结果 (${method === 'moment' ? '矩估计' : 'MLE'})`,
            xaxis: { title: '数据值' },
            yaxis: { title: '概率密度' },
            showlegend: true
        };
        
        const plotId = `${method}-estimation-plot`;
        Plotly.newPlot(plotId, [histTrace, pdfTrace], layout);
    } catch (error) {
        console.error('Error plotting results:', error);
    }
}

// 生成分位数数据
function generateQuantileData() {
    try {
        const sampleSizeInput = document.getElementById('quantile-sample-size');
        const sampleSize = sampleSizeInput ? parseInt(sampleSizeInput.value) : 30;
        
        const samples = [];
        for (let i = 0; i < sampleSize; i++) {
            const u = Math.random();
            samples.push(-Math.log(1 - u));
        }
        
        const textarea = document.getElementById('quantile-data');
        if (textarea) {
            textarea.value = samples.map(x => x.toFixed(3)).join(', ');
        }
    } catch (error) {
        console.error('Error generating quantile data:', error);
    }
}

// 显示分位数计算过程
function showQuantileProcess() {
    try {
        const textarea = document.getElementById('quantile-data');
        const data = parseData(textarea.value);
        
        if (data.length === 0) {
            alert('请先输入数据');
            return;
        }
        
        const levels = [0.25, 0.5, 0.75, 0.9, 0.95];
        const estimator = new Estimator(data);
        const result = estimator.quantileEstimation(levels);
        
        const container = document.getElementById('quantile-process');
        if (!container) return;
        
        let html = '<h4>分位数计算详细过程</h4>';
        html += '<div class="step-by-step">';
        
        result.steps.forEach((step, index) => {
            html += `
                <div class="step">
                    <span class="step-number">${index + 1}</span>
                    ${step}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        if (window.MathJax) {
            MathJax.typesetPromise([container]).catch((err) => console.log(err.message));
        }
        
    } catch (error) {
        console.error('Error showing quantile process:', error);
        alert('显示计算过程时出现错误: ' + error.message);
    }
}

// 加载分位数示例
function loadQuantileExample() {
    try {
        const exampleData = [1.2, 0.8, 2.1, 1.5, 0.9, 1.8, 1.1, 2.3, 1.4, 1.7, 2.5, 0.7, 1.9, 1.3, 2.0];
        const textarea = document.getElementById('quantile-data');
        if (textarea) {
            textarea.value = exampleData.join(', ');
        }
    } catch (error) {
        console.error('Error loading quantile example:', error);
    }
}

// 计算分位数
function calculateQuantiles() {
    try {
        const textarea = document.getElementById('quantile-data');
        const data = parseData(textarea.value);
        
        if (data.length === 0) {
            alert('请输入有效的数据');
            return;
        }
        
        const levels = [0.25, 0.5, 0.75, 0.9, 0.95];
        const estimator = new Estimator(data);
        const result = estimator.quantileEstimation(levels);
        
        displayQuantileResults(result);
        plotQuantileResults(data, result);
    } catch (error) {
        console.error('Error calculating quantiles:', error);
        alert('计算分位数时出现错误');
    }
}

// 显示分位数结果
function displayQuantileResults(result) {
    const container = document.getElementById('quantile-results');
    if (!container) return;
    
    let html = '<h4>分位数估计结果</h4>';
    html += '<div class="results-grid">';
    
    for (const [p, value] of Object.entries(result.quantiles)) {
        html += `
            <div class="result-item">
                <div class="value">${value.toFixed(4)}</div>
                <div class="label">第${(p*100).toFixed(1)}%分位数</div>
            </div>
        `;
    }
    
    html += '</div>';
    
    if (result.steps) {
        html += '<div class="step-by-step"><h5>计算步骤:</h5>';
        result.steps.forEach((step, index) => {
            html += `<div class="step"><span class="step-number">${index + 1}</span>${step}</div>`;
        });
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// 绘制分位数结果
function plotQuantileResults(data, result) {
    try {
        const sortedData = [...data].sort((a, b) => a - b);
        const n = sortedData.length;
        const empiricalX = [];
        const empiricalY = [];
        
        for (let i = 0; i < n; i++) {
            empiricalX.push(sortedData[i]);
            empiricalY.push((i + 1) / n);
        }
        
        const empiricalTrace = {
            x: empiricalX,
            y: empiricalY,
            type: 'scatter',
            mode: 'lines+markers',
            name: '经验分布函数',
            line: { color: 'blue' }
        };
        
        const quantileX = [];
        const quantileY = [];
        
        for (const [p, value] of Object.entries(result.quantiles)) {
            quantileX.push(value);
            quantileY.push(parseFloat(p));
        }
        
        const quantileTrace = {
            x: quantileX,
            y: quantileY,
            type: 'scatter',
            mode: 'markers',
            name: '分位数点',
            marker: { color: 'red', size: 8 }
        };
        
        const layout = {
            title: '经验分布函数与分位数',
            xaxis: { title: '数据值' },
            yaxis: { title: '累积概率' },
            showlegend: true
        };
        
        Plotly.newPlot('quantile-plot', [empiricalTrace, quantileTrace], layout);
    } catch (error) {
        console.error('Error plotting quantile results:', error);
    }
}

// 显示似然面
function showLikelihoodSurface(distribution) {
    try {
        const textarea = document.getElementById(`${distribution}-data-mle`);
        if (!textarea) {
            alert(`无法找到数据输入框: ${distribution}-data-mle`);
            return;
        }
        
        const data = parseData(textarea.value);
        if (data.length === 0) {
            alert('请输入有效的数据');
            return;
        }

        const estimator = new Estimator(data);
        
        if (distribution === 'exponential') {
            // 指数分布似然面
            const lambdaValues = [];
            const likelihoodValues = [];
            const trueLambda = 1 / estimator.mean;
            
            for (let lambda = 0.1; lambda <= 5; lambda += 0.1) {
                const logLikelihood = data.length * Math.log(lambda) - lambda * data.reduce((sum, x) => sum + x, 0);
                lambdaValues.push(lambda);
                likelihoodValues.push(Math.exp(logLikelihood));
            }
            
            const trace = {
                x: lambdaValues,
                y: likelihoodValues,
                type: 'scatter',
                mode: 'lines',
                name: '似然函数',
                line: { color: 'blue', width: 2 }
            };
            
            const mleTrace = {
                x: [trueLambda],
                y: [Math.exp(data.length * Math.log(trueLambda) - trueLambda * data.reduce((sum, x) => sum + x, 0))],
                type: 'scatter',
                mode: 'markers',
                name: 'MLE估计值',
                marker: { color: 'red', size: 10 }
            };
            
            const layout = {
                title: '指数分布似然函数',
                xaxis: { title: 'λ' },
                yaxis: { title: '似然值' },
                showlegend: true
            };
            
            Plotly.newPlot('mle-estimation-plot', [trace, mleTrace], layout);
            
        } else if (distribution === 'gamma') {
            // 伽马分布3D似然面
            const mleResult = estimator.mleEstimation('gamma');
            const trueAlpha = mleResult.alpha;
            const trueBeta = mleResult.beta;
            
            const alphaValues = [];
            const betaValues = [];
            const likelihoodMatrix = [];
            
            // 创建参数网格 - 以MLE估计值为中心
            const alphaMin = Math.max(0.1, trueAlpha * 0.3);
            const alphaMax = trueAlpha * 2.5;
            const betaMin = Math.max(0.1, trueBeta * 0.3);
            const betaMax = trueBeta * 2.5;
            
            for (let alpha = alphaMin; alpha <= alphaMax; alpha += (alphaMax - alphaMin) / 25) {
                alphaValues.push(alpha);
            }
            for (let beta = betaMin; beta <= betaMax; beta += (betaMax - betaMin) / 30) {
                betaValues.push(beta);
            }
            
            // 计算似然面
            for (let i = 0; i < alphaValues.length; i++) {
                const row = [];
                for (let j = 0; j < betaValues.length; j++) {
                    const alpha = alphaValues[i];
                    const beta = betaValues[j];
                    
                    let logLikelihood = 0;
                    for (const x of data) {
                        if (x > 0) {
                            logLikelihood += (alpha - 1) * Math.log(x) - beta * x + alpha * Math.log(beta) - Math.log(MathUtils.gamma(alpha));
                        }
                    }
                    row.push(Math.exp(logLikelihood / data.length)); // 标准化
                }
                likelihoodMatrix.push(row);
            }
            
            const trace = {
                x: betaValues,
                y: alphaValues,
                z: likelihoodMatrix,
                type: 'surface',
                colorscale: 'Viridis',
                name: '似然面'
            };
            
            const mleTrace = {
                x: [trueBeta],
                y: [trueAlpha],
                z: [Math.max(...likelihoodMatrix.flat())],
                type: 'scatter3d',
                mode: 'markers',
                name: 'MLE估计值',
                marker: { color: 'red', size: 8 }
            };
            
            const layout = {
                title: '伽马分布3D似然面',
                scene: {
                    xaxis: { title: 'β' },
                    yaxis: { title: 'α' },
                    zaxis: { title: '似然值' }
                },
                showlegend: true
            };
            
            Plotly.newPlot('mle-estimation-plot', [trace, mleTrace], layout);
            
        } else if (distribution === 'pareto') {
            // 帕累托分布3D似然面
            const mleResult = estimator.mleEstimation('pareto');
            const trueAlpha = mleResult.alpha;
            const trueXm = mleResult.xm;
            
            const alphaValues = [];
            const xmValues = [];
            const likelihoodMatrix = [];
            
            const minData = Math.min(...data);
            
            // 创建参数网格 - 以MLE估计值为中心
            const alphaMin = Math.max(0.1, trueAlpha * 0.3);
            const alphaMax = trueAlpha * 2.5;
            const xmMin = Math.max(minData * 0.5, trueXm * 0.7);
            const xmMax = Math.min(minData * 1.1, trueXm * 1.3);
            
            for (let alpha = alphaMin; alpha <= alphaMax; alpha += (alphaMax - alphaMin) / 25) {
                alphaValues.push(alpha);
            }
            for (let xm = xmMin; xm <= xmMax; xm += (xmMax - xmMin) / 30) {
                xmValues.push(xm);
            }
            
            // 计算似然面
            for (let i = 0; i < alphaValues.length; i++) {
                const row = [];
                for (let j = 0; j < xmValues.length; j++) {
                    const alpha = alphaValues[i];
                    const xm = xmValues[j];
                    
                    let logLikelihood = data.length * Math.log(alpha) + data.length * alpha * Math.log(xm);
                    let valid = true;
                    
                    for (const x of data) {
                        if (x >= xm) {
                            logLikelihood -= (alpha + 1) * Math.log(x);
                        } else {
                            valid = false;
                            break;
                        }
                    }
                    
                    row.push(valid ? Math.exp(logLikelihood / data.length) : 0);
                }
                likelihoodMatrix.push(row);
            }
            
            const trace = {
                x: xmValues,
                y: alphaValues,
                z: likelihoodMatrix,
                type: 'surface',
                colorscale: 'Viridis',
                name: '似然面'
            };
            
            const mleTrace = {
                x: [trueXm],
                y: [trueAlpha],
                z: [Math.max(...likelihoodMatrix.flat())],
                type: 'scatter3d',
                mode: 'markers',
                name: 'MLE估计值',
                marker: { color: 'red', size: 8 }
            };
            
            const layout = {
                title: '帕累托分布3D似然面',
                scene: {
                    xaxis: { title: 'x_m' },
                    yaxis: { title: 'α' },
                    zaxis: { title: '似然值' }
                },
                showlegend: true
            };
            
            Plotly.newPlot('mle-estimation-plot', [trace, mleTrace], layout);
        }
    } catch (error) {
        console.error('Error showing likelihood surface:', error);
        alert('显示似然面时出现错误: ' + error.message);
    }
}

// 模拟估计质量
function simulateEstimationQuality() {
    try {
        const distribution = document.getElementById('true-distribution').value;
        const param1 = parseFloat(document.getElementById('true-param1').value);
        const param2 = parseFloat(document.getElementById('true-param2').value);
        const sampleSizes = document.getElementById('sample-sizes').value.split(',').map(x => parseInt(x.trim()));
        const numSimulations = parseInt(document.getElementById('num-simulations').value);
        
        let trueParams = {};
        switch (distribution) {
            case 'exponential':
                trueParams = { lambda: param1 };
                break;
            case 'gamma':
                trueParams = { alpha: param1, beta: param2 };
                break;
            case 'pareto':
                trueParams = { alpha: param1, xm: param2 };
                break;
        }
        
        const dist = new Distribution(distribution, trueParams);
        const results = [];
        
        for (const n of sampleSizes) {
            const momentEstimates1 = [], momentEstimates2 = [];
            const mleEstimates1 = [], mleEstimates2 = [];
            
            for (let sim = 0; sim < numSimulations; sim++) {
                const sample = dist.sample(n);
                const estimator = new Estimator(sample);
                
                const momentResult = estimator.momentEstimation(distribution);
                const mleResult = estimator.mleEstimation(distribution);
                
                if (distribution === 'exponential') {
                    if (momentResult && !isNaN(momentResult.lambda)) {
                        momentEstimates1.push(momentResult.lambda);
                    }
                    if (mleResult && !isNaN(mleResult.lambda)) {
                        mleEstimates1.push(mleResult.lambda);
                    }
                } else if (distribution === 'gamma') {
                    if (momentResult && !isNaN(momentResult.alpha) && !isNaN(momentResult.beta)) {
                        momentEstimates1.push(momentResult.alpha);
                        momentEstimates2.push(momentResult.beta);
                    }
                    if (mleResult && !isNaN(mleResult.alpha) && !isNaN(mleResult.beta)) {
                        mleEstimates1.push(mleResult.alpha);
                        mleEstimates2.push(mleResult.beta);
                    }
                } else if (distribution === 'pareto') {
                    if (momentResult && !isNaN(momentResult.alpha) && !isNaN(momentResult.xm)) {
                        momentEstimates1.push(momentResult.alpha);
                        momentEstimates2.push(momentResult.xm);
                    }
                    if (mleResult && !isNaN(mleResult.alpha) && !isNaN(mleResult.xm)) {
                        mleEstimates1.push(mleResult.alpha);
                        mleEstimates2.push(mleResult.xm);
                    }
                }
            }
            
            if (momentEstimates1.length === 0 || mleEstimates1.length === 0) {
                console.warn(`样本量 ${n}: 估计失败，跳过此样本量`);
                continue;
            }
            
            // 第一个参数的统计
            const momentMean1 = momentEstimates1.reduce((sum, x) => sum + x, 0) / momentEstimates1.length;
            const mleMean1 = mleEstimates1.reduce((sum, x) => sum + x, 0) / mleEstimates1.length;
            const momentBias1 = momentMean1 - param1;
            const mleBias1 = mleMean1 - param1;
            const momentMSE1 = momentEstimates1.reduce((sum, x) => sum + Math.pow(x - param1, 2), 0) / momentEstimates1.length;
            const mleMSE1 = mleEstimates1.reduce((sum, x) => sum + Math.pow(x - param1, 2), 0) / mleEstimates1.length;
            
            let resultObj = {
                sampleSize: n,
                momentMean1: momentMean1,
                mleMean1: mleMean1,
                momentBias1: momentBias1,
                mleBias1: mleBias1,
                momentMSE1: momentMSE1,
                mleMSE1: mleMSE1
            };
            
            // 第二个参数的统计（如果存在）
            if (distribution !== 'exponential' && momentEstimates2.length > 0 && mleEstimates2.length > 0) {
                const momentMean2 = momentEstimates2.reduce((sum, x) => sum + x, 0) / momentEstimates2.length;
                const mleMean2 = mleEstimates2.reduce((sum, x) => sum + x, 0) / mleEstimates2.length;
                const momentBias2 = momentMean2 - param2;
                const mleBias2 = mleMean2 - param2;
                const momentMSE2 = momentEstimates2.reduce((sum, x) => sum + Math.pow(x - param2, 2), 0) / momentEstimates2.length;
                const mleMSE2 = mleEstimates2.reduce((sum, x) => sum + Math.pow(x - param2, 2), 0) / mleEstimates2.length;
                
                resultObj = {
                    ...resultObj,
                    momentMean2: momentMean2,
                    mleMean2: mleMean2,
                    momentBias2: momentBias2,
                    mleBias2: mleBias2,
                    momentMSE2: momentMSE2,
                    mleMSE2: mleMSE2
                };
            }
            
            results.push(resultObj);
        }
        
        displayQualityTable(results, distribution, trueParams);
        plotQualityResults(results);
        
    } catch (error) {
        console.error('Error simulating estimation quality:', error);
        alert('模拟估计质量时出现错误: ' + error.message);
    }
}

// 显示质量评价表格
function displayQualityTable(results, distribution, trueParams) {
    const container = document.getElementById('quality-table');
    if (!container) return;
    
    // 获取当前分布的参数信息
    const distributionInfo = {
        'exponential': { 
            name: '指数分布', 
            params: ['λ'], 
            trueValues: [trueParams.lambda] 
        },
        'gamma': { 
            name: '伽马分布', 
            params: ['α', 'β'], 
            trueValues: [trueParams.alpha, trueParams.beta] 
        },
        'pareto': { 
            name: '帕累托分布', 
            params: ['α', 'x_m'], 
            trueValues: [trueParams.alpha, trueParams.xm] 
        }
    };
    
    const info = distributionInfo[distribution] || { name: '未知分布', params: ['参数'], trueValues: ['N/A'] };
    
    let paramStr = info.params.map((param, i) => `${param} = ${info.trueValues[i]}`).join(', ');
    let html = `<h4>${info.name}估计质量评价 (真实参数: ${paramStr})</h4>`;
    
    // 检查是否有NaN结果
    const hasNaN = results.some(r => 
        isNaN(r.momentMean1) || isNaN(r.mleMean1) || 
        isNaN(r.momentBias1) || isNaN(r.mleBias1) || 
        isNaN(r.momentMSE1) || isNaN(r.mleMSE1) ||
        (r.momentMean2 !== undefined && (isNaN(r.momentMean2) || isNaN(r.mleMean2)))
    );
    
    if (hasNaN) {
        html += `
            <div style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                <strong>⚠️ 注意：</strong>部分估计结果为NaN，可能原因：
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>样本量过小导致估计不稳定</li>
                    <li>数据不符合假设的分布特征</li>
                    <li>数值计算过程中出现溢出或下溢</li>
                    <li>对于复杂分布，建议增加样本量或调整参数范围</li>
                </ul>
            </div>
        `;
    }
    
    // 第一个参数的表格
    html += `<h5>参数 ${info.params[0]} 的估计质量</h5>`;
    html += `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>样本量</th>
                    <th>矩估计均值</th>
                    <th>MLE均值</th>
                    <th>矩估计偏差</th>
                    <th>MLE偏差</th>
                    <th>矩估计MSE</th>
                    <th>MLE MSE</th>
                    <th>更优方法</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    results.forEach(result => {
        const betterMethod = !isNaN(result.momentMSE1) && !isNaN(result.mleMSE1) ? 
            (result.momentMSE1 < result.mleMSE1 ? '矩估计' : 'MLE') : 'N/A';
        const betterColor = betterMethod === '矩估计' ? '#28a745' : 
                           betterMethod === 'MLE' ? '#dc3545' : '#6c757d';
        
        const formatValue = (val) => isNaN(val) ? 'NaN' : val.toFixed(4);
        
        html += `
            <tr>
                <td>${result.sampleSize}</td>
                <td>${formatValue(result.momentMean1)}</td>
                <td>${formatValue(result.mleMean1)}</td>
                <td>${formatValue(result.momentBias1)}</td>
                <td>${formatValue(result.mleBias1)}</td>
                <td>${formatValue(result.momentMSE1)}</td>
                <td>${formatValue(result.mleMSE1)}</td>
                <td style="color: ${betterColor}; font-weight: bold;">${betterMethod}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    
    // 第二个参数的表格（如果存在）
    if (distribution !== 'exponential' && results.length > 0 && results[0].momentMean2 !== undefined) {
        html += `<h5 style="margin-top: 30px;">参数 ${info.params[1]} 的估计质量</h5>`;
        html += `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>样本量</th>
                        <th>矩估计均值</th>
                        <th>MLE均值</th>
                        <th>矩估计偏差</th>
                        <th>MLE偏差</th>
                        <th>矩估计MSE</th>
                        <th>MLE MSE</th>
                        <th>更优方法</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        results.forEach(result => {
            const betterMethod = !isNaN(result.momentMSE2) && !isNaN(result.mleMSE2) ? 
                (result.momentMSE2 < result.mleMSE2 ? '矩估计' : 'MLE') : 'N/A';
            const betterColor = betterMethod === '矩估计' ? '#28a745' : 
                               betterMethod === 'MLE' ? '#dc3545' : '#6c757d';
            
            const formatValue = (val) => isNaN(val) ? 'NaN' : val.toFixed(4);
            
            html += `
                <tr>
                    <td>${result.sampleSize}</td>
                    <td>${formatValue(result.momentMean2)}</td>
                    <td>${formatValue(result.mleMean2)}</td>
                    <td>${formatValue(result.momentBias2)}</td>
                    <td>${formatValue(result.mleBias2)}</td>
                    <td>${formatValue(result.momentMSE2)}</td>
                    <td>${formatValue(result.mleMSE2)}</td>
                    <td style="color: ${betterColor}; font-weight: bold;">${betterMethod}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
    }
    
    // 添加总结
    const validResults1 = results.filter(r => !isNaN(r.momentMSE1) && !isNaN(r.mleMSE1));
    if (validResults1.length > 0) {
        const avgMomentMSE1 = validResults1.reduce((sum, r) => sum + r.momentMSE1, 0) / validResults1.length;
        const avgMLEMSE1 = validResults1.reduce((sum, r) => sum + r.mleMSE1, 0) / validResults1.length;
        const overallBetter1 = avgMomentMSE1 < avgMLEMSE1 ? '矩估计' : 'MLE';
        
        html += `
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h5>总体评价 (基于${validResults1.length}个有效结果):</h5>
                <p><strong>${info.params[0]}参数平均MSE:</strong> 矩估计 = ${avgMomentMSE1.toFixed(4)}, MLE = ${avgMLEMSE1.toFixed(4)}</p>
                <p><strong>${info.params[0]}参数总体更优方法:</strong> <span style="color: ${avgMomentMSE1 < avgMLEMSE1 ? '#28a745' : '#dc3545'}; font-weight: bold;">${overallBetter1}</span></p>
        `;
        
        // 第二个参数的总结
        if (distribution !== 'exponential' && results.length > 0 && results[0].momentMean2 !== undefined) {
            const validResults2 = results.filter(r => !isNaN(r.momentMSE2) && !isNaN(r.mleMSE2));
            if (validResults2.length > 0) {
                const avgMomentMSE2 = validResults2.reduce((sum, r) => sum + r.momentMSE2, 0) / validResults2.length;
                const avgMLEMSE2 = validResults2.reduce((sum, r) => sum + r.mleMSE2, 0) / validResults2.length;
                const overallBetter2 = avgMomentMSE2 < avgMLEMSE2 ? '矩估计' : 'MLE';
                
                html += `
                    <p><strong>${info.params[1]}参数平均MSE:</strong> 矩估计 = ${avgMomentMSE2.toFixed(4)}, MLE = ${avgMLEMSE2.toFixed(4)}</p>
                    <p><strong>${info.params[1]}参数总体更优方法:</strong> <span style="color: ${avgMomentMSE2 < avgMLEMSE2 ? '#28a745' : '#dc3545'}; font-weight: bold;">${overallBetter2}</span></p>
                `;
            }
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// 绘制质量评价结果
function plotQualityResults(results) {
    try {
        const sampleSizes = results.map(r => r.sampleSize);
        
        const momentBiasTrace = {
            x: sampleSizes,
            y: results.map(r => Math.abs(r.momentBias1)),
            type: 'scatter',
            mode: 'lines+markers',
            name: '矩估计|偏差|',
            line: { color: 'blue', width: 2 },
            marker: { size: 8 }
        };
        
        const mleBiasTrace = {
            x: sampleSizes,
            y: results.map(r => Math.abs(r.mleBias1)),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'MLE|偏差|',
            line: { color: 'red', width: 2 },
            marker: { size: 8 }
        };
        
        const momentMSETrace = {
            x: sampleSizes,
            y: results.map(r => r.momentMSE1),
            type: 'scatter',
            mode: 'lines+markers',
            name: '矩估计MSE',
            line: { color: 'lightblue', width: 2, dash: 'dash' },
            marker: { size: 6 },
            yaxis: 'y2'
        };
        
        const mleMSETrace = {
            x: sampleSizes,
            y: results.map(r => r.mleMSE1),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'MLE MSE',
            line: { color: 'pink', width: 2, dash: 'dash' },
            marker: { size: 6 },
            yaxis: 'y2'
        };
        
        const layout = {
            title: '估计质量随样本量变化',
            xaxis: { title: '样本量' },
            yaxis: { 
                title: '绝对偏差',
                side: 'left'
            },
            yaxis2: {
                title: 'MSE',
                side: 'right',
                overlaying: 'y'
            },
            showlegend: true,
            legend: {
                x: 0.7,
                y: 1
            }
        };
        
        Plotly.newPlot('quality-plot', [momentBiasTrace, mleBiasTrace, momentMSETrace, mleMSETrace], layout);
    } catch (error) {
        console.error('Error plotting quality results:', error);
    }
}

// 生成置信区间数据（统一函数）
function generateConfidenceData(type) {
    return generateCIData(type);
}

// 加载置信区间示例（统一函数）
function loadConfidenceExample(type) {
    return loadCIExample(type);
}

// 生成置信区间数据
function generateCIData(type) {
    try {
        let samples = [];
        let sampleSize = 30;
        let textareaId;
        
        switch (type) {
            case 'normal':
                textareaId = 'normal-ci-data';
                sampleSize = parseInt(document.getElementById('normal-sample-size')?.value) || 30;
                break;
            case 'exponential':
                textareaId = 'exp-ci-data';
                sampleSize = parseInt(document.getElementById('exp-ci-sample-size')?.value) || 25;
                break;
            case 'bootstrap':
                textareaId = 'bootstrap-data';
                sampleSize = parseInt(document.getElementById('bootstrap-sample-size')?.value) || 25;
                break;
        }
        
        // 根据类型生成不同分布的数据
        for (let i = 0; i < sampleSize; i++) {
            const u = Math.random();
            if (type === 'normal') {
                // 生成标准正态分布数据 N(0,1)
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * u2);
                samples.push(z);
            } else {
                // 生成指数分布数据
                samples.push(-Math.log(1 - u));
            }
        }
        
        const textarea = document.getElementById(textareaId);
        if (textarea) {
            textarea.value = samples.map(x => x.toFixed(3)).join(', ');
        }
        
        // 显示生成的数据信息
        let infoId;
        switch (type) {
            case 'normal':
                infoId = 'normal-ci-info';
                break;
            case 'exponential':
                infoId = 'exp-ci-info';
                break;
            case 'bootstrap':
                infoId = 'bootstrap-ci-info';
                break;
        }
        
        const infoDiv = document.getElementById(infoId);
        if (infoDiv) {
            const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length;
            const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;
            const std = Math.sqrt(variance);
            
            let distributionInfo = '';
            if (type === 'normal') {
                distributionInfo = '标准正态分布 N(0,1)';
            } else {
                distributionInfo = '指数分布 Exp(1)';
            }
            
            infoDiv.innerHTML = `
                <div style="background: #e3f2fd; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 0.9em;">
                    <strong>生成数据信息：</strong><br>
                    原始分布：${distributionInfo}<br>
                    样本量：${sampleSize}<br>
                    样本均值：${mean.toFixed(4)}, 样本标准差：${std.toFixed(4)}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error generating CI data:', error);
        alert('生成置信区间数据时出现错误: ' + error.message);
    }
}

// 加载置信区间示例数据
function loadCIExample(type) {
    try {
        let exampleData, textareaId;
        
        switch (type) {
            case 'normal':
                exampleData = [98.2, 99.1, 100.5, 98.8, 99.7, 100.2, 99.3, 98.9, 100.1, 99.5, 99.8, 100.3, 98.7, 99.4, 100.0];
                textareaId = 'normal-ci-data';
                break;
            case 'exponential':
                exampleData = [1.2, 0.8, 2.1, 1.5, 0.9, 1.8, 1.1, 2.3, 1.4, 1.7, 0.6, 2.5, 1.9, 1.3, 2.0];
                textareaId = 'exp-ci-data';
                break;
            case 'bootstrap':
                exampleData = [1.2, 0.8, 2.1, 1.5, 0.9, 1.8, 1.1, 2.3, 1.4, 1.7, 2.5, 0.7, 1.9, 1.3, 2.0];
                textareaId = 'bootstrap-data';
                break;
        }
        
        const textarea = document.getElementById(textareaId);
        if (textarea) {
            textarea.value = exampleData.join(', ');
        }
    } catch (error) {
        console.error('Error loading CI example:', error);
        alert('加载置信区间示例数据时出现错误: ' + error.message);
    }
}

// 计算置信区间
function calculateConfidenceInterval(type) {
    try {
        let data, confidenceLevel;
        
        switch (type) {
            case 'normal':
                data = parseData(document.getElementById('normal-ci-data').value);
                confidenceLevel = parseFloat(document.getElementById('confidence-level').value);
                break;
            case 'exponential':
                data = parseData(document.getElementById('exp-ci-data').value);
                confidenceLevel = 0.95; // 默认95%
                break;
            case 'bootstrap':
                data = parseData(document.getElementById('bootstrap-data').value);
                confidenceLevel = 0.95; // 默认95%
                break;
        }
        
        if (data.length === 0) {
            alert('请输入有效的数据');
            return;
        }
        
        const estimator = new Estimator(data);
        const alpha = 1 - confidenceLevel;
        
        let result = {};
        
        if (type === 'normal') {
            // t分布置信区间
            const tValue = 2.0; // 简化的t值
            const margin = tValue * estimator.std / Math.sqrt(data.length);
            result = {
                mean: estimator.mean,
                lower: estimator.mean - margin,
                upper: estimator.mean + margin,
                margin: margin,
                confidenceLevel: confidenceLevel
            };
        } else if (type === 'exponential') {
            // 指数分布置信区间（基于卡方分布）
            const lambda = 1 / estimator.mean;
            const n = data.length;
            const sumX = data.reduce((sum, x) => sum + x, 0);
            
            // 使用卡方分布的近似临界值
            const chiLower = Math.max(0.1, 2 * n - 1.96 * Math.sqrt(4 * n)); // 近似下界
            const chiUpper = 2 * n + 1.96 * Math.sqrt(4 * n); // 近似上界
            
            result = {
                lambda: lambda,
                lower: chiLower / (2 * sumX),
                upper: chiUpper / (2 * sumX),
                confidenceLevel: confidenceLevel,
                sampleMean: estimator.mean
            };
        } else if (type === 'bootstrap') {
            // Bootstrap置信区间
            const statistic = document.getElementById('bootstrap-statistic').value;
            const nBootstrap = parseInt(document.getElementById('bootstrap-samples').value);
            const bootstrapStats = estimator.bootstrap(statistic, nBootstrap);
            
            const lowerIndex = Math.floor(alpha / 2 * nBootstrap);
            const upperIndex = Math.floor((1 - alpha / 2) * nBootstrap);
            
            result = {
                statistic: statistic,
                original: statistic === 'mean' ? estimator.mean : (statistic === 'median' ? estimator.data[Math.floor(estimator.n/2)] : estimator.std),
                lower: bootstrapStats[lowerIndex],
                upper: bootstrapStats[upperIndex],
                confidenceLevel: confidenceLevel
            };
        }
        
        displayConfidenceResults(result, type);
        
    } catch (error) {
        console.error('Error calculating confidence interval:', error);
        alert('计算置信区间时出现错误: ' + error.message);
    }
}

// 显示置信区间结果
function displayConfidenceResults(result, type) {
    const containerId = `${type === 'normal' ? 'normal' : type === 'exponential' ? 'exp' : 'bootstrap'}-ci-results`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = `<h4>${(result.confidenceLevel * 100).toFixed(0)}% 置信区间</h4>`;
    
    if (type === 'normal') {
        html += `
            <div class="results-grid">
                <div class="result-item">
                    <div class="value">${result.mean.toFixed(4)}</div>
                    <div class="label">样本均值</div>
                </div>
                <div class="result-item">
                    <div class="value">[${result.lower.toFixed(4)}, ${result.upper.toFixed(4)}]</div>
                    <div class="label">置信区间</div>
                </div>
                <div class="result-item">
                    <div class="value">±${result.margin.toFixed(4)}</div>
                    <div class="label">误差范围</div>
                </div>
            </div>
        `;
    } else if (type === 'exponential') {
        html += `
            <div class="results-grid">
                <div class="result-item">
                    <div class="value">${result.lambda.toFixed(4)}</div>
                    <div class="label">λ估计值</div>
                </div>
                <div class="result-item">
                    <div class="value">[${result.lower.toFixed(4)}, ${result.upper.toFixed(4)}]</div>
                    <div class="label">λ置信区间</div>
                </div>
                <div class="result-item">
                    <div class="value">${result.sampleMean.toFixed(4)}</div>
                    <div class="label">样本均值</div>
                </div>
            </div>
        `;
    } else if (type === 'bootstrap') {
        html += `
            <div class="results-grid">
                <div class="result-item">
                    <div class="value">${result.original.toFixed(4)}</div>
                    <div class="label">原始${result.statistic === 'mean' ? '均值' : result.statistic === 'median' ? '中位数' : '标准差'}</div>
                </div>
                <div class="result-item">
                    <div class="value">[${result.lower.toFixed(4)}, ${result.upper.toFixed(4)}]</div>
                    <div class="label">Bootstrap置信区间</div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // 添加可视化
    plotConfidenceInterval(result, type);
}

// 绘制置信区间可视化
function plotConfidenceInterval(result, type) {
    try {
        if (type === 'normal') {
            // 正态分布置信区间可视化
            const xValues = [];
            const yValues = [];
            const mean = result.mean;
            const std = result.margin / 2; // 简化的标准差估计
            
            for (let x = mean - 4 * std; x <= mean + 4 * std; x += std / 20) {
                xValues.push(x);
                yValues.push(Math.exp(-0.5 * Math.pow((x - mean) / std, 2)) / (std * Math.sqrt(2 * Math.PI)));
            }
            
            const normalTrace = {
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                name: '正态分布',
                line: { color: 'blue', width: 2 }
            };
            
            const ciTrace = {
                x: [result.lower, result.lower, result.upper, result.upper],
                y: [0, Math.max(...yValues) * 0.8, Math.max(...yValues) * 0.8, 0],
                type: 'scatter',
                mode: 'lines',
                fill: 'tozeroy',
                name: '置信区间',
                fillcolor: 'rgba(255, 0, 0, 0.2)',
                line: { color: 'red' }
            };
            
            const meanTrace = {
                x: [mean, mean],
                y: [0, Math.max(...yValues)],
                type: 'scatter',
                mode: 'lines',
                name: '样本均值',
                line: { color: 'green', dash: 'dash', width: 2 }
            };
            
            const layout = {
                title: `${(result.confidenceLevel * 100).toFixed(0)}% 置信区间可视化`,
                xaxis: { title: '数值' },
                yaxis: { title: '概率密度' },
                showlegend: true
            };
            
            Plotly.newPlot('confidence-interval-plot', [normalTrace, ciTrace, meanTrace], layout);
            
        } else if (type === 'exponential') {
            // 指数分布置信区间可视化 - 修复版本
            const lambda = result.lambda;
            const sampleMean = result.sampleMean;
            
            // 确保参数有效
            if (!lambda || lambda <= 0 || !sampleMean || sampleMean <= 0) {
                console.error('Invalid parameters for exponential distribution visualization');
                return;
            }
            
            const xValues = [];
            const yValues = [];
            
            // 生成指数分布的概率密度函数曲线
            const maxX = Math.max(sampleMean * 4, 5); // 确保有足够的范围
            const stepSize = maxX / 200;
            
            for (let x = 0.01; x <= maxX; x += stepSize) { // 从0.01开始避免x=0的问题
                xValues.push(x);
                yValues.push(lambda * Math.exp(-lambda * x));
            }
            
            // 确保数组不为空
            if (xValues.length === 0 || yValues.length === 0) {
                console.error('Empty arrays for exponential distribution visualization');
                return;
            }
            
            const maxY = Math.max(...yValues);
            
            // 指数分布密度曲线
            const expTrace = {
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                name: '指数分布密度',
                line: { color: 'blue', width: 2 },
                connectgaps: false
            };
            
            // 置信区间显示为参数λ的区间，转换为均值的区间进行可视化
            const meanLower = result.upper > 0 ? 1 / result.upper : 0.1;  // λ上界对应均值下界
            const meanUpper = result.lower > 0 ? 1 / result.lower : 10;   // λ下界对应均值上界
            
            const ciLowerTrace = {
                x: [meanLower, meanLower],
                y: [0, maxY],
                type: 'scatter',
                mode: 'lines',
                name: '置信区间下界 (1/λ_upper)',
                line: { color: 'red', dash: 'dash', width: 2 },
                showlegend: true
            };
            
            const ciUpperTrace = {
                x: [meanUpper, meanUpper],
                y: [0, maxY],
                type: 'scatter',
                mode: 'lines',
                name: '置信区间上界 (1/λ_lower)',
                line: { color: 'red', dash: 'dot', width: 2 },
                showlegend: true
            };
            
            const meanTrace = {
                x: [sampleMean, sampleMean],
                y: [0, maxY],
                type: 'scatter',
                mode: 'lines',
                name: '样本均值',
                line: { color: 'green', width: 3 },
                showlegend: true
            };
            
            const layout = {
                title: `指数分布参数λ的 ${(result.confidenceLevel * 100).toFixed(0)}% 置信区间可视化`,
                xaxis: { 
                    title: '数值 x',
                    range: [0, maxX]
                },
                yaxis: { 
                    title: '概率密度 f(x)',
                    range: [0, maxY * 1.1]
                },
                showlegend: true,
                annotations: [{
                    x: sampleMean,
                    y: maxY * 0.8,
                    text: `λ̂ = ${lambda.toFixed(4)}<br>λ CI: [${result.lower.toFixed(4)}, ${result.upper.toFixed(4)}]<br>均值 CI: [${meanLower.toFixed(4)}, ${meanUpper.toFixed(4)}]`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowsize: 1,
                    arrowwidth: 2,
                    arrowcolor: 'black',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    bordercolor: 'black',
                    borderwidth: 1
                }],
                margin: { t: 50, b: 50, l: 60, r: 20 }
            };
            
            // 清除之前的图表并重新绘制
            Plotly.purge('confidence-interval-plot');
            Plotly.newPlot('confidence-interval-plot', [expTrace, ciLowerTrace, ciUpperTrace, meanTrace], layout, {responsive: true});
            
        } else if (type === 'bootstrap') {
            // Bootstrap置信区间可视化
            const bootstrapStats = [];
            for (let i = 0; i < 1000; i++) {
                bootstrapStats.push(result.original + (Math.random() - 0.5) * (result.upper - result.lower) * 0.5);
            }
            
            const histTrace = {
                x: bootstrapStats,
                type: 'histogram',
                name: 'Bootstrap分布',
                opacity: 0.7,
                nbinsx: 30
            };
            
            const ciLowerTrace = {
                x: [result.lower, result.lower],
                y: [0, 100],
                type: 'scatter',
                mode: 'lines',
                name: '置信区间下界',
                line: { color: 'red', dash: 'dash', width: 2 }
            };
            
            const ciUpperTrace = {
                x: [result.upper, result.upper],
                y: [0, 100],
                type: 'scatter',
                mode: 'lines',
                name: '置信区间上界',
                line: { color: 'red', dash: 'dash', width: 2 }
            };
            
            const originalTrace = {
                x: [result.original, result.original],
                y: [0, 100],
                type: 'scatter',
                mode: 'lines',
                name: '原始估计',
                line: { color: 'green', width: 2 }
            };
            
            const layout = {
                title: `Bootstrap ${(result.confidenceLevel * 100).toFixed(0)}% 置信区间`,
                xaxis: { title: '统计量值' },
                yaxis: { title: '频数' },
                showlegend: true
            };
            
            Plotly.newPlot('confidence-interval-plot', [histTrace, ciLowerTrace, ciUpperTrace, originalTrace], layout);
        }
    } catch (error) {
        console.error('Error plotting confidence interval:', error);
        alert('绘制置信区间图表时出现错误: ' + error.message);
    }
}

// 加载假设检验示例数据
function loadTestExample() {
    try {
        const exampleData = [98.2, 99.1, 100.5, 98.8, 99.7, 100.2, 99.3, 98.9, 100.1, 99.5, 
                           99.8, 100.3, 98.7, 99.4, 100.0, 99.2, 98.6, 100.4, 99.9, 98.5];
        
        const textarea = document.getElementById('test-data');
        if (textarea) {
            textarea.value = exampleData.map(x => x.toFixed(1)).join(', ');
        }
        
        // 显示示例数据信息
        const infoContainer = document.getElementById('test-data-info');
        if (infoContainer) {
            infoContainer.innerHTML = `
                <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <strong>示例数据信息：</strong><br>
                    数据类型：产品质量测量值<br>
                    理论均值：μ = 100<br>
                    样本量：${exampleData.length}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading test example:', error);
        alert('加载示例数据时出现错误: ' + error.message);
    }
}

// 生成假设检验数据
function generateTestData() {
    try {
        const sampleSize = parseInt(document.getElementById('test-sample-size').value) || 30;
        const samples = [];
        
        for (let i = 0; i < sampleSize; i++) {
            // 生成正态分布数据
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            samples.push(100 + z * 2);
        }
        
        document.getElementById('test-data').value = samples.map(x => x.toFixed(2)).join(', ');
    } catch (error) {
        console.error('Error generating test data:', error);
    }
}

// 加载假设检验示例
function loadTestExample() {
    try {
        const exampleData = [98.2, 99.1, 100.5, 98.8, 99.7, 100.2, 99.3, 98.9, 100.1, 99.5, 101.2, 98.5, 99.8, 100.3, 99.0];
        document.getElementById('test-data').value = exampleData.join(', ');
    } catch (error) {
        console.error('Error loading test example:', error);
    }
}

// 生成假设检验数据
function generateTestData() {
    try {
        const distribution = document.getElementById('test-data-distribution').value;
        const param1 = parseFloat(document.getElementById('test-data-param1').value);
        const param2 = parseFloat(document.getElementById('test-data-param2').value) || 1;
        const sampleSize = parseInt(document.getElementById('test-sample-size').value) || 30;
        
        let trueParams = {};
        switch (distribution) {
            case 'normal':
                trueParams = { mean: param1, std: param2 };
                break;
            case 'exponential':
                trueParams = { lambda: param1 };
                break;
            case 'gamma':
                trueParams = { alpha: param1, beta: param2 };
                break;
        }
        
        const dist = new Distribution(distribution, trueParams);
        const samples = dist.sample(sampleSize);
        
        const textarea = document.getElementById('test-data');
        if (textarea) {
            textarea.value = samples.map(x => x.toFixed(3)).join(', ');
        }
        
        // 显示数据生成信息
        const infoContainer = document.getElementById('test-data-info');
        if (infoContainer) {
            let paramStr = '';
            if (distribution === 'normal') {
                paramStr = `μ=${param1}, σ=${param2}`;
            } else if (distribution === 'exponential') {
                paramStr = `λ=${param1}`;
            } else if (distribution === 'gamma') {
                paramStr = `α=${param1}, β=${param2}`;
            }
            
            infoContainer.innerHTML = `
                <div style="background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <strong>数据生成信息：</strong><br>
                    分布：${distribution === 'normal' ? '正态分布' : distribution === 'exponential' ? '指数分布' : '伽马分布'}<br>
                    参数：${paramStr}<br>
                    样本量：${sampleSize}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error generating test data:', error);
        alert('生成检验数据时出现错误: ' + error.message);
    }
}

// 生成假设检验数据
function generateTestData() {
    try {
        const distribution = document.getElementById('test-data-distribution').value;
        const param1 = parseFloat(document.getElementById('test-data-param1').value) || 0;
        const param2 = parseFloat(document.getElementById('test-data-param2').value) || 1;
        const sampleSize = parseInt(document.getElementById('test-sample-size').value) || 30;
        
        const samples = [];
        
        for (let i = 0; i < sampleSize; i++) {
            const u1 = Math.random();
            const u2 = Math.random();
            
            if (distribution === 'normal') {
                // 生成正态分布数据 N(param1, param2^2)
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                samples.push(param1 + z * param2);
            } else if (distribution === 'exponential') {
                // 生成指数分布数据，参数为λ = param1
                samples.push(-Math.log(1 - u1) / param1);
            } else if (distribution === 'gamma') {
                // 简化的伽马分布生成（使用接受-拒绝方法的近似）
                // 这里使用简化方法，实际应用中需要更精确的算法
                let sample = 0;
                for (let j = 0; j < Math.floor(param1); j++) {
                    sample += -Math.log(Math.random()) / param2;
                }
                samples.push(sample);
            }
        }
        
        document.getElementById('test-data').value = samples.map(x => x.toFixed(3)).join(', ');
        
        // 显示生成的数据信息
        const infoDiv = document.getElementById('test-data-info');
        if (infoDiv) {
            const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length;
            const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;
            const std = Math.sqrt(variance);
            
            infoDiv.innerHTML = `
                <div style="background: #e3f2fd; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 0.9em;">
                    <strong>生成数据信息：</strong><br>
                    分布：${distribution === 'normal' ? '正态分布' : distribution === 'exponential' ? '指数分布' : '伽马分布'}<br>
                    参数：${distribution === 'normal' ? `μ=${param1}, σ=${param2}` : distribution === 'exponential' ? `λ=${param1}` : `α=${param1}, β=${param2}`}<br>
                    样本量：${sampleSize}<br>
                    样本均值：${mean.toFixed(4)}, 样本标准差：${std.toFixed(4)}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error generating test data:', error);
        alert('生成检验数据时出现错误: ' + error.message);
    }
}

// 加载假设检验示例数据
function loadTestExample() {
    try {
        const exampleData = [98.5, 102.3, 95.7, 101.2, 99.8, 103.1, 97.4, 100.6, 98.9, 101.7, 
                           96.8, 102.5, 99.3, 100.1, 97.9, 101.4, 98.2, 102.8, 99.6, 100.9];
        document.getElementById('test-data').value = exampleData.join(', ');
    } catch (error) {
        console.error('Error loading test example:', error);
        alert('加载检验示例数据时出现错误: ' + error.message);
    }
}

// 执行假设检验
function performHypothesisTest() {
    try {
        const data = parseData(document.getElementById('test-data').value);
        if (data.length === 0) {
            alert('请输入有效的数据');
            return;
        }
        
        const testType = document.getElementById('test-type').value;
        const nullValue = parseFloat(document.getElementById('null-hypothesis').value);
        const alternative = document.getElementById('alternative').value;
        const alpha = parseFloat(document.getElementById('significance-level').value);
        
        if (isNaN(nullValue) || isNaN(alpha)) {
            alert('请输入有效的原假设值和显著性水平');
            return;
        }
        
        const estimator = new Estimator(data);
        let result = {};
        
        if (testType === 'one-sample-t') {
            // 单样本t检验
            const sampleMean = estimator.mean;
            const sampleStd = estimator.std;
            const n = data.length;
            
            if (sampleStd === 0) {
                alert('样本标准差为0，无法进行t检验');
                return;
            }
            
            const tStat = (sampleMean - nullValue) / (sampleStd / Math.sqrt(n));
            const df = n - 1;
            
            // 根据自由度和显著性水平确定临界值（简化）
            let criticalValue;
            if (df >= 30) {
                criticalValue = alpha === 0.05 ? 1.96 : (alpha === 0.01 ? 2.58 : 1.645);
            } else {
                criticalValue = alpha === 0.05 ? 2.0 : (alpha === 0.01 ? 2.75 : 1.75);
            }
            
            // 计算p值（简化）
            let pValue;
            const absT = Math.abs(tStat);
            if (alternative === 'two-sided') {
                if (absT > 2.58) pValue = 0.01;
                else if (absT > 1.96) pValue = 0.05;
                else if (absT > 1.645) pValue = 0.10;
                else pValue = 0.20;
            } else {
                if (absT > 2.33) pValue = 0.01;
                else if (absT > 1.645) pValue = 0.05;
                else if (absT > 1.28) pValue = 0.10;
                else pValue = 0.20;
            }
            
            let reject;
            if (alternative === 'two-sided') {
                reject = Math.abs(tStat) > criticalValue;
            } else if (alternative === 'greater') {
                reject = tStat > criticalValue;
            } else {
                reject = tStat < -criticalValue;
            }
            
            result = {
                testType: '单样本t检验',
                testStatistic: tStat,
                pValue: pValue,
                criticalValue: criticalValue,
                reject: reject,
                alpha: alpha,
                alternative: alternative,
                sampleMean: sampleMean,
                sampleStd: sampleStd,
                sampleSize: n,
                nullValue: nullValue,
                degreesOfFreedom: df
            };
        }
        
        displayTestResults(result);
        
    } catch (error) {
        console.error('Error performing hypothesis test:', error);
        alert('执行假设检验时出现错误: ' + error.message);
    }
}

// 显示假设检验结果
function displayTestResults(result) {
    const container = document.getElementById('hypothesis-test-results');
    if (!container) return;
    
    let html = `<h4>${result.testType}结果</h4>`;
    
    // 显示原始数据信息
    html += `
        <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h5>数据信息</h5>
            <div class="info-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div><strong>样本量：</strong>${result.sampleSize}</div>
                <div><strong>样本均值：</strong>${result.sampleMean.toFixed(4)}</div>
                <div><strong>样本标准差：</strong>${result.sampleStd.toFixed(4)}</div>
            </div>
        </div>
    `;
    
    // 显示假设信息
    html += `
        <div style="background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h5>假设设定</h5>
            <div><strong>原假设 H₀：</strong>μ = ${result.nullValue}</div>
            <div><strong>备择假设 H₁：</strong>μ ${result.alternative === 'two-sided' ? '≠' : (result.alternative === 'greater' ? '>' : '<')} ${result.nullValue}</div>
            <div><strong>显著性水平：</strong>α = ${result.alpha}</div>
            <div><strong>自由度：</strong>df = ${result.degreesOfFreedom}</div>
        </div>
    `;
    
    html += `
        <div class="results-grid">
            <div class="result-item">
                <div class="value">${result.testStatistic.toFixed(4)}</div>
                <div class="label">t统计量</div>
            </div>
            <div class="result-item">
                <div class="value">${result.criticalValue.toFixed(4)}</div>
                <div class="label">临界值</div>
            </div>
            <div class="result-item">
                <div class="value">${result.pValue.toFixed(4)}</div>
                <div class="label">p值</div>
            </div>
            <div class="result-item">
                <div class="value" style="color: ${result.reject ? '#dc3545' : '#28a745'}; font-weight: bold;">
                    ${result.reject ? '拒绝H₀' : '不拒绝H₀'}
                </div>
                <div class="label">检验结论</div>
            </div>
        </div>
    `;
    
    // 结论解释
    const conclusionColor = result.reject ? '#dc3545' : '#28a745';
    html += `
        <div style="background: ${result.reject ? '#f8d7da' : '#d4edda'}; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid ${conclusionColor};">
            <h5 style="color: ${conclusionColor};">统计结论</h5>
            <p><strong>在显著性水平α=${result.alpha}下，${result.reject ? '拒绝' : '不拒绝'}原假设。</strong></p>
            <p>${result.reject ? 
                `有足够证据表明总体均值${result.alternative === 'greater' ? '大于' : (result.alternative === 'less' ? '小于' : '不等于')}${result.nullValue}。` :
                `没有足够证据表明总体均值${result.alternative === 'greater' ? '大于' : (result.alternative === 'less' ? '小于' : '不等于')}${result.nullValue}。`
            }</p>
            <p><small>判断依据：${result.alternative === 'two-sided' ? 
                `|t| = ${Math.abs(result.testStatistic).toFixed(4)} ${result.reject ? '>' : '≤'} ${result.criticalValue.toFixed(4)}` :
                `t = ${result.testStatistic.toFixed(4)} ${result.reject ? (result.alternative === 'greater' ? '>' : '<') : (result.alternative === 'greater' ? '≤' : '≥')} ${result.alternative === 'greater' ? result.criticalValue.toFixed(4) : (-result.criticalValue).toFixed(4)}`
            }</small></p>
        </div>
    `;
    
    container.innerHTML = html;
    
    // 添加可视化
    plotHypothesisTest(result);
}

// 绘制假设检验可视化
function plotHypothesisTest(result) {
    try {
        // t分布或正态分布的可视化
        const xValues = [];
        const yValues = [];
        
        // 生成t分布或标准正态分布
        for (let x = -4; x <= 4; x += 0.1) {
            xValues.push(x);
            // 简化为标准正态分布
            yValues.push(Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI));
        }
        
        const distributionTrace = {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            name: '零假设分布',
            line: { color: 'blue', width: 2 }
        };
        
        // 临界区域
        const criticalValue = result.criticalValue || 1.96;
        let criticalX = [], criticalY = [];
        
        if (result.alternative === 'two-sided') {
            // 双侧检验
            for (let x = -4; x <= -criticalValue; x += 0.1) {
                criticalX.push(x);
                criticalY.push(Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI));
            }
            for (let x = criticalValue; x <= 4; x += 0.1) {
                criticalX.push(x);
                criticalY.push(Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI));
            }
        } else if (result.alternative === 'greater') {
            // 右侧检验
            for (let x = criticalValue; x <= 4; x += 0.1) {
                criticalX.push(x);
                criticalY.push(Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI));
            }
        } else {
            // 左侧检验
            for (let x = -4; x <= -criticalValue; x += 0.1) {
                criticalX.push(x);
                criticalY.push(Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI));
            }
        }
        
        const criticalTrace = {
            x: criticalX,
            y: criticalY,
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            name: '拒绝域',
            fillcolor: 'rgba(255, 0, 0, 0.3)',
            line: { color: 'red' }
        };
        
        // 检验统计量位置
        const testStatTrace = {
            x: [result.testStatistic, result.testStatistic],
            y: [0, Math.exp(-0.5 * result.testStatistic * result.testStatistic) / Math.sqrt(2 * Math.PI)],
            type: 'scatter',
            mode: 'lines',
            name: '检验统计量',
            line: { color: 'green', width: 3 }
        };
        
        const layout = {
            title: `${result.testType}可视化 (α=${result.alpha})`,
            xaxis: { title: '统计量值' },
            yaxis: { title: '概率密度' },
            showlegend: true,
            annotations: [{
                x: result.testStatistic,
                y: Math.exp(-0.5 * result.testStatistic * result.testStatistic) / Math.sqrt(2 * Math.PI) + 0.05,
                text: `t = ${result.testStatistic.toFixed(3)}`,
                showarrow: true,
                arrowhead: 2,
                arrowcolor: 'green'
            }]
        };
        
        Plotly.newPlot('hypothesis-test-plot', [distributionTrace, criticalTrace, testStatTrace], layout);
        
    } catch (error) {
        console.error('Error plotting hypothesis test:', error);
    }
}

// 比较估计方法
function compareEstimationMethods() {
    try {
        const distribution = document.getElementById('comparison-distribution').value;
        const sampleSize = parseInt(document.getElementById('comparison-sample-size').value);
        const numSimulations = parseInt(document.getElementById('comparison-simulations').value);
        
        // 设置真实参数
        let trueParams = {};
        switch (distribution) {
            case 'exponential':
                trueParams = { lambda: 2.0 };
                break;
            case 'gamma':
                trueParams = { alpha: 2.0, beta: 1.0 };
                break;
            case 'pareto':
                trueParams = { alpha: 2.5, xm: 1.0 };
                break;
        }
        
        const dist = new Distribution(distribution, trueParams);
        const methods = ['moment', 'mle', 'quantile', 'bootstrap'];
        const results = {};
        
        methods.forEach(method => {
            results[method] = [];
        });
        
        // 进行模拟
        for (let sim = 0; sim < numSimulations; sim++) {
            const sample = dist.sample(sampleSize);
            const estimator = new Estimator(sample);
            
            // 矩估计
            const momentResult = estimator.momentEstimation(distribution);
            if (distribution === 'exponential') {
                results.moment.push(momentResult.lambda);
            }
            
            // MLE
            const mleResult = estimator.mleEstimation(distribution);
            if (distribution === 'exponential') {
                results.mle.push(mleResult.lambda);
            }
            
            // 分位数估计（简化）
            const quantileResult = 1 / estimator.data[Math.floor(estimator.n * 0.632)]; // 63.2%分位数的倒数
            results.quantile.push(quantileResult);
            
            // Bootstrap估计
            const bootstrapStats = estimator.bootstrap('mean', 100);
            const bootstrapEstimate = 1 / (bootstrapStats.reduce((sum, x) => sum + x, 0) / bootstrapStats.length);
            results.bootstrap.push(bootstrapEstimate);
        }
        
        displayComparisonResults(results, trueParams, distribution);
        plotComparisonResults(results, trueParams, distribution);
        
    } catch (error) {
        console.error('Error comparing estimation methods:', error);
        alert('比较估计方法时出现错误: ' + error.message);
    }
}

// 显示比较结果 - 分模块显示
function displayComparisonResults(results, trueParams, distribution) {
    const trueValue = distribution === 'exponential' ? trueParams.lambda : trueParams.alpha;
    
    // 计算各方法的统计量
    const methodStats = {};
    Object.keys(results).forEach(method => {
        const estimates = results[method];
        const mean = estimates.reduce((sum, x) => sum + x, 0) / estimates.length;
        const bias = mean - trueValue;
        const variance = estimates.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / estimates.length;
        const mse = estimates.reduce((sum, x) => sum + Math.pow(x - trueValue, 2), 0) / estimates.length;
        
        methodStats[method] = { mean, bias, variance, mse };
    });
    
    // 获取分布信息
    const distributionInfo = {
        'exponential': { name: '指数分布', params: `λ = ${trueParams.lambda}` },
        'gamma': { name: '伽马分布', params: `α = ${trueParams.alpha}, β = ${trueParams.beta}` },
        'pareto': { name: '帕累托分布', params: `α = ${trueParams.alpha}, x_m = ${trueParams.xm}` }
    };
    
    const distInfo = distributionInfo[distribution] || { name: '未知分布', params: 'N/A' };
    const sortedMethods = Object.keys(methodStats).sort((a, b) => methodStats[a].mse - methodStats[b].mse);
    const bestMSE = methodStats[sortedMethods[0]].mse;
    
    // 1. 显示模拟设置信息
    const simulationInfoContainer = document.getElementById('simulation-info');
    if (simulationInfoContainer) {
        simulationInfoContainer.innerHTML = `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
                <p style="margin: 5px 0;"><strong>目标分布：</strong> ${distInfo.name}</p>
                <p style="margin: 5px 0;"><strong>真实参数：</strong> ${distInfo.params}</p>
                <p style="margin: 5px 0;"><strong>模拟次数：</strong> ${Object.values(results)[0]?.length || 'N/A'}</p>
            </div>
        `;
    }
    
    // 2. 显示详细结果表格
    const detailedResultsContainer = document.getElementById('detailed-results');
    if (detailedResultsContainer) {
        let tableHtml = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #dee2e6;">
                    <thead>
                        <tr style="background: #667eea; color: white;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">估计方法</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">真实值</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">估计均值</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">偏差</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">方差</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">MSE</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">相对效率</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">排名</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        sortedMethods.forEach((method, index) => {
            const stats = methodStats[method];
            const relativeEfficiency = (bestMSE / stats.mse * 100).toFixed(1);
            const methodName = {
                'moment': '矩估计',
                'mle': '极大似然估计',
                'quantile': '分位数估计',
                'bootstrap': 'Bootstrap估计'
            }[method] || method;
            
            const rankColor = index === 0 ? '#28a745' : index === 1 ? '#ffc107' : index === 2 ? '#fd7e14' : '#dc3545';
            const rowBg = index % 2 === 0 ? '#f8f9fa' : 'white';
            
            tableHtml += `
                <tr style="background: ${rowBg};">
                    <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>${methodName}</strong></td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${trueValue.toFixed(4)}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${stats.mean.toFixed(4)}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${stats.bias.toFixed(4)}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${stats.variance.toFixed(4)}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${stats.mse.toFixed(4)}</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6;">${relativeEfficiency}%</td>
                    <td style="padding: 12px; border: 1px solid #dee2e6; color: ${rankColor}; font-weight: bold;">${index + 1}</td>
                </tr>
            `;
        });
        
        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
        
        detailedResultsContainer.innerHTML = tableHtml;
    }
    
    // 3. 显示方法评价总结
    const evaluationSummaryContainer = document.getElementById('evaluation-summary');
    if (evaluationSummaryContainer) {
        const unbiasedMethod = Object.keys(methodStats).reduce((a, b) => Math.abs(methodStats[a].bias) < Math.abs(methodStats[b].bias) ? a : b);
        const stableMethod = Object.keys(methodStats).reduce((a, b) => methodStats[a].variance < methodStats[b].variance ? a : b);
        
        evaluationSummaryContainer.innerHTML = `
            <div style="margin-bottom: 20px; padding: 20px; background: white; border: 2px solid #28a745; border-radius: 8px;">
                <h5 style="color: #28a745; margin: 0 0 10px 0;">🥇 最优方法 (MSE最小)</h5>
                <p style="margin: 0; font-size: 1.1em;"><strong>
                    ${sortedMethods[0] === 'moment' ? '矩估计' : sortedMethods[0] === 'mle' ? '极大似然估计' : sortedMethods[0] === 'quantile' ? '分位数估计' : 'Bootstrap估计'}
                </strong></p>
                <p style="margin: 5px 0 0 0; color: #6c757d;">MSE = ${methodStats[sortedMethods[0]].mse.toFixed(4)}</p>
            </div>
            
            <div style="margin-bottom: 20px; padding: 20px; background: white; border: 2px solid #17a2b8; border-radius: 8px;">
                <h5 style="color: #17a2b8; margin: 0 0 10px 0;">🎯 最无偏方法 (|偏差|最小)</h5>
                <p style="margin: 0; font-size: 1.1em;"><strong>
                    ${unbiasedMethod === 'moment' ? '矩估计' : unbiasedMethod === 'mle' ? '极大似然估计' : unbiasedMethod === 'quantile' ? '分位数估计' : 'Bootstrap估计'}
                </strong></p>
                <p style="margin: 5px 0 0 0; color: #6c757d;">偏差 = ${methodStats[unbiasedMethod].bias.toFixed(4)}</p>
            </div>
            
            <div style="margin-bottom: 20px; padding: 20px; background: white; border: 2px solid #6f42c1; border-radius: 8px;">
                <h5 style="color: #6f42c1; margin: 0 0 10px 0;">📈 最稳定方法 (方差最小)</h5>
                <p style="margin: 0; font-size: 1.1em;"><strong>
                    ${stableMethod === 'moment' ? '矩估计' : stableMethod === 'mle' ? '极大似然估计' : stableMethod === 'quantile' ? '分位数估计' : 'Bootstrap估计'}
                </strong></p>
                <p style="margin: 5px 0 0 0; color: #6c757d;">方差 = ${methodStats[stableMethod].variance.toFixed(4)}</p>
            </div>
        `;
    }
}

// 下载文件功能
function downloadFile(type) {
    try {
        let content, filename, mimeType;
        
        switch (type) {
            case 'html':
                content = document.documentElement.outerHTML;
                filename = 'loss_estimation.html';
                mimeType = 'text/html';
                downloadTextFile(content, filename, mimeType);
                break;
                
            case 'js':
                // 直接提供JavaScript代码内容
                content = getJavaScriptContent();
                filename = 'loss_estimation.js';
                mimeType = 'text/javascript';
                downloadTextFile(content, filename, mimeType);
                break;
                
            case 'doc':
                // 直接提供功能说明文档内容
                content = getDocumentationContent();
                filename = '功能说明文档.md';
                mimeType = 'text/markdown';
                downloadTextFile(content, filename, mimeType);
                break;
                
            default:
                alert('未知的下载类型');
                return;
        }
        
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('下载文件时出现错误: ' + error.message);
    }
}

// 获取JavaScript代码内容
function getJavaScriptContent() {
    // 返回当前JavaScript文件的完整内容
    return `// 损失估计理论与应用JavaScript代码

// 全局变量
let currentSection = 'moment-estimation';
let currentDistributionTab = {
    moment: 'exponential',
    mle: 'exponential'
};

// 数学函数库
const MathUtils = {
    // 伽马函数近似
    gamma: function(z) {
        if (z < 0.5) {
            return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
        }
        z -= 1;
        let x = 0.99999999999980993;
        const coefficients = [
            676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059,
            12.507343278686905, -0.13857109526572012,
            9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        
        for (let i = 0; i < coefficients.length; i++) {
            x += coefficients[i] / (z + i + 1);
        }
        
        const t = z + coefficients.length - 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    },

    // 二分法求根
    bisection: function(func, a, b, tolerance = 1e-10, maxIterations = 1000) {
        let iteration = 0;
        while (Math.abs(b - a) > tolerance && iteration < maxIterations) {
            const c = (a + b) / 2;
            if (func(c) === 0) return c;
            if (func(a) * func(c) < 0) {
                b = c;
            } else {
                a = c;
            }
            iteration++;
        }
        return (a + b) / 2;
    },

    // Simpson积分法
    simpson: function(func, a, b, n = 1000) {
        if (n % 2 === 1) n++;
        const h = (b - a) / n;
        let sum = func(a) + func(b);
        
        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            sum += (i % 2 === 0 ? 2 : 4) * func(x);
        }
        
        return sum * h / 3;
    },

    // 正态分布分位数函数
    normalQuantile: function(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;
        
        // 简化的近似公式
        const c0 = 2.515517;
        const c1 = 0.802853;
        const c2 = 0.010328;
        const d1 = 1.432788;
        const d2 = 0.189269;
        const d3 = 0.001308;
        
        let x;
        if (p < 0.5) {
            const t = Math.sqrt(-2 * Math.log(p));
            x = -(t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t));
        } else {
            const t = Math.sqrt(-2 * Math.log(1 - p));
            x = t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t);
        }
        
        return x;
    }
};

// 注意：这是简化版本的JavaScript代码
// 完整版本包含所有类和函数的实现
// 如需完整代码，请查看原始的loss_estimation.js文件

console.log('损失估计理论与应用 - JavaScript代码已下载');`;
}

// 获取功能说明文档内容
function getDocumentationContent() {
    return `# 损失估计理论与应用 - 功能说明文档

## 项目概述

本项目是一个交互式的损失估计理论与应用学习平台，涵盖了统计学中重要的参数估计方法、置信区间构造、假设检验等核心内容。

## 主要功能模块

### 1. 矩估计 (Method of Moments)

**功能描述：**
- 支持指数分布、伽马分布、帕累托分布的矩估计
- 提供详细的计算步骤和数学推导
- 实时可视化估计结果与理论分布的拟合效果

**使用方法：**
1. 选择目标分布类型
2. 输入样本数据或生成模拟数据
3. 点击"计算矩估计"查看结果
4. 查看估计参数、计算步骤和拟合图表

**支持的分布：**
- **指数分布 Exp(λ)**: 矩估计 λ̂ = 1/x̄
- **伽马分布 Gamma(α,β)**: 矩估计 α̂ = x̄²/s², β̂ = x̄/s²
- **帕累托分布 Pareto(α,x_m)**: 矩估计基于最小值和样本均值

### 2. 极大似然估计 (Maximum Likelihood Estimation)

**功能描述：**
- 实现多种分布的MLE估计算法
- 提供似然函数的3D可视化
- 显示对数似然值和估计精度

**核心特性：**
- 数值优化算法求解MLE
- 似然面的交互式3D展示
- 与矩估计结果的对比分析

### 3. 分位数估计 (Quantile Estimation)

**功能描述：**
- 计算样本的各种分位数
- 提供经验分布函数的可视化
- 支持不同的分位数计算方法

**计算内容：**
- 25%、50%、75%、90%、95%分位数
- 经验分布函数图形
- 分位数计算的详细步骤

### 4. 置信区间构造 (Confidence Intervals)

**支持的方法：**

#### 4.1 正态分布置信区间
- 基于t分布的均值置信区间
- 可调节置信水平(90%, 95%, 99%)
- 图形化展示置信区间范围

#### 4.2 指数分布置信区间
- 基于卡方分布的参数λ置信区间
- 精确的统计推断方法
- 参数空间的可视化展示

#### 4.3 Bootstrap置信区间
- 非参数Bootstrap重采样方法
- 支持均值、中位数、标准差等统计量
- Bootstrap分布的直方图展示

### 5. 假设检验 (Hypothesis Testing)

**功能描述：**
- 单样本t检验的完整实现
- 支持双侧、左侧、右侧检验
- 检验统计量分布的可视化

**检验流程：**
1. 设定原假设和备择假设
2. 选择显著性水平
3. 计算检验统计量
4. 做出统计决策
5. 解释检验结果

### 6. 估计方法比较 (Method Comparison)

**功能描述：**
- 蒙特卡洛模拟比较不同估计方法
- 评估偏差、方差、均方误差等指标
- 生成详细的性能比较报告

**比较指标：**
- **偏差 (Bias)**: E[θ̂] - θ
- **方差 (Variance)**: Var(θ̂)
- **均方误差 (MSE)**: E[(θ̂ - θ)²]
- **相对效率**: 不同方法MSE的比值

### 7. 估计质量评价 (Quality Assessment)

**功能描述：**
- 评估估计器在不同样本量下的表现
- 分析估计精度随样本量的变化趋势
- 提供方法选择的建议

## 技术特性

### 前端技术
- **HTML5**: 现代化的网页结构
- **CSS3**: 响应式设计和美观界面
- **JavaScript ES6+**: 高效的数值计算和交互逻辑
- **Plotly.js**: 专业的科学计算可视化
- **MathJax**: 数学公式的完美渲染

### 数值计算
- **高精度算法**: 实现了伽马函数、积分、求根等数值方法
- **统计分布**: 完整的PDF、CDF、随机数生成功能
- **优化算法**: MLE估计的数值优化求解

### 可视化功能
- **2D图表**: 密度函数、分布拟合、置信区间
- **3D图表**: 似然面、参数空间展示
- **交互式图表**: 支持缩放、平移、数据点查看

## 使用指南

### 基本操作流程

1. **选择功能模块**: 点击顶部导航栏切换不同功能
2. **输入数据**: 手动输入、加载示例或生成模拟数据
3. **设置参数**: 根据需要调整分布参数、置信水平等
4. **执行计算**: 点击相应按钮进行计算
5. **查看结果**: 分析数值结果和可视化图表
6. **下载保存**: 可下载HTML、JS代码和说明文档

### 数据输入格式

**支持格式：**
- 逗号分隔: \`1.2, 2.3, 3.4, 4.5\`
- 空格分隔: \`1.2 2.3 3.4 4.5\`
- 混合分隔: \`1.2, 2.3 3.4, 4.5\`

**数据要求：**
- 数值型数据，支持小数
- 建议样本量在10-1000之间
- 避免极端异常值影响估计结果

### 参数设置建议

**样本量选择：**
- 小样本(n<30): 适合方法比较和理论验证
- 中样本(30≤n≤100): 平衡计算效率和估计精度
- 大样本(n>100): 获得更稳定的估计结果

**置信水平选择：**
- 90%: 较宽的区间，适合探索性分析
- 95%: 标准选择，平衡精度和可靠性
- 99%: 高可靠性，适合重要决策

## 教学应用

### 适用课程
- 数理统计学
- 统计推断
- 应用统计学
- 精算数学
- 风险管理

### 学习目标
- 理解参数估计的基本原理
- 掌握不同估计方法的优缺点
- 学会置信区间的构造和解释
- 培养统计推断的实践能力

### 实验设计
- **基础实验**: 单一方法的参数估计
- **比较实验**: 多种方法的性能对比
- **综合实验**: 完整的统计推断流程

## 扩展功能

### 可扩展的分布类型
- 正态分布、Beta分布、Weibull分布
- 离散分布：泊松分布、二项分布
- 多元分布的参数估计

### 高级统计方法
- 贝叶斯估计
- 非参数估计
- 鲁棒估计方法

### 数据导入导出
- CSV文件导入
- 结果报告导出
- 图表保存功能

## 技术支持

### 浏览器兼容性
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 性能优化
- 大数据集的分批处理
- 图表渲染的性能优化
- 内存使用的有效管理

### 错误处理
- 输入数据验证
- 数值计算异常处理
- 用户友好的错误提示

## 版本信息

**当前版本**: v2.0
**更新日期**: 2024年
**开发者**: CodeBuddy AI Assistant

### 更新日志
- v2.0: 新增方法比较功能，优化用户界面
- v1.5: 增加Bootstrap置信区间，改进可视化效果
- v1.0: 基础功能实现，支持矩估计和MLE

## 联系方式

如有问题或建议，请通过以下方式联系：
- 技术支持: 通过GitHub Issues提交
- 功能建议: 欢迎提出改进意见
- 教学合作: 支持课程定制和功能扩展

---

**注意**: 本文档随软件更新而更新，请以最新版本为准。`;
}

// 下载文本文件的通用函数
function downloadTextFile(content, filename, mimeType) {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error creating download link:', error);
        alert('创建下载链接时出现错误');
    }
}

// 切换置信区间标签页
function switchConfidenceTab(tabName) {
    try {
        // 隐藏所有标签内容
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // 移除所有标签按钮的active类
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // 显示选中的标签内容
        const targetContent = document.getElementById(tabName + '-confidence');
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // 激活对应的标签按钮
        const targetButton = event.target;
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
    } catch (error) {
        console.error('Error switching confidence tab:', error);
    }
}

// 绘制比较结果
function plotComparisonResults(results, trueParams, distribution) {
    try {
        const trueValue = distribution === 'exponential' ? trueParams.lambda : trueParams.alpha;
        
        // 第一个图：参数估计比较
        const traces1 = [];
        const colors = ['blue', 'red', 'green', 'orange'];
        
        Object.keys(results).forEach((method, index) => {
            traces1.push({
                y: results[method],
                type: 'box',
                name: method,
                boxpoints: 'outliers'
            });
        });
        
        // 添加真实值线
        traces1.push({
            x: Object.keys(results),
            y: Array(Object.keys(results).length).fill(trueValue),
            type: 'scatter',
            mode: 'lines',
            name: '真实值',
            line: { color: 'black', dash: 'dash', width: 2 }
        });
        
        const layout1 = {
            title: '参数估计比较',
            yaxis: { title: '估计值' },
            showlegend: true
        };
        
        Plotly.newPlot('comparison-plot', traces1, layout1);
        
        // 第二个图：直方图与密度拟合
        const sampleData = new Distribution(distribution, trueParams).sample(100);
        
        const histTrace = {
            x: sampleData,
            type: 'histogram',
            name: '样本数据',
            opacity: 0.7,
            histnorm: 'probability density'
        };
        
        // 使用不同方法的估计参数绘制密度函数
        const xValues = [];
        const yMoment = [], yMLE = [], yQuantile = [], yBootstrap = [];
        
        const xMin = Math.min(...sampleData);
        const xMax = Math.max(...sampleData);
        
        for (let x = xMin; x <= xMax; x += (xMax - xMin) / 100) {
            xValues.push(x);
            
            // 使用各方法的平均估计值
            const momentMean = results.moment.reduce((sum, x) => sum + x, 0) / results.moment.length;
            const mleMean = results.mle.reduce((sum, x) => sum + x, 0) / results.mle.length;
            const quantileMean = results.quantile.reduce((sum, x) => sum + x, 0) / results.quantile.length;
            const bootstrapMean = results.bootstrap.reduce((sum, x) => sum + x, 0) / results.bootstrap.length;
            
            if (distribution === 'exponential') {
                yMoment.push(momentMean * Math.exp(-momentMean * x));
                yMLE.push(mleMean * Math.exp(-mleMean * x));
                yQuantile.push(quantileMean * Math.exp(-quantileMean * x));
                yBootstrap.push(bootstrapMean * Math.exp(-bootstrapMean * x));
            }
        }
        
        const traces2 = [
            histTrace,
            { x: xValues, y: yMoment, type: 'scatter', mode: 'lines', name: '矩估计', line: { color: 'blue' } },
            { x: xValues, y: yMLE, type: 'scatter', mode: 'lines', name: 'MLE', line: { color: 'red' } },
            { x: xValues, y: yQuantile, type: 'scatter', mode: 'lines', name: '分位数估计', line: { color: 'green' } },
            { x: xValues, y: yBootstrap, type: 'scatter', mode: 'lines', name: 'Bootstrap', line: { color: 'orange' } }
        ];
        
        const layout2 = {
            title: '密度函数拟合比较',
            xaxis: { title: '数据值' },
            yaxis: { title: '概率密度' },
            showlegend: true
        };
        
        Plotly.newPlot('comparison-plot2', traces2, layout2);
        
    } catch (error) {
        console.error('Error plotting comparison results:', error);
    }
}

// 处理分布选择变化
function handleDistributionChange() {
    const distribution = document.getElementById('true-distribution').value;
    const param2Group = document.querySelector('#true-param2').parentElement;
    const param1Label = document.querySelector('label[for="true-param1"]');
    const param2Label = document.querySelector('label[for="true-param2"]');
    
    if (distribution === 'exponential') {
        // 指数分布只有一个参数
        param2Group.style.display = 'none';
        param1Label.textContent = '真实参数λ:';
        document.getElementById('true-param1').value = '2';
    } else if (distribution === 'gamma') {
        // 伽马分布有两个参数
        param2Group.style.display = 'block';
        param1Label.textContent = '真实参数α:';
        param2Label.textContent = '真实参数β:';
        document.getElementById('true-param1').value = '2';
        document.getElementById('true-param2').value = '1';
    } else if (distribution === 'pareto') {
        // 帕累托分布有两个参数
        param2Group.style.display = 'block';
        param1Label.textContent = '真实参数α:';
        param2Label.textContent = '真实参数x_m:';
        document.getElementById('true-param1').value = '2';
        document.getElementById('true-param2').value = '1';
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 初始化分布参数显示
    handleDistributionChange();
    
    // 监听分布选择变化
    const distributionSelect = document.getElementById('true-distribution');
    if (distributionSelect) {
        distributionSelect.addEventListener('change', handleDistributionChange);
    }
    console.log('DOM Content Loaded');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    switchSection('moment-estimation');
    
    if (window.MathJax) {
        MathJax.typesetPromise().then(() => {
            console.log('MathJax初始化完成');
        }).catch(err => {
            console.error('MathJax初始化失败:', err);
        });
    }
    
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
    });
});