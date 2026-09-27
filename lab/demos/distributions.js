// 分布计算和可视化JavaScript代码

// 数学函数辅助
const gamma = (z) => {
    // 使用Lanczos近似计算伽马函数
    const g = 7;
    const C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    
    z -= 1;
    let x = C[0];
    for (let i = 1; i < g + 2; i++) {
        x += C[i] / (z + i);
    }
    
    const t = z + g + 0.5;
    const sqrt2pi = Math.sqrt(2 * Math.PI);
    return sqrt2pi * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
};

// 分布类定义
class DistributionCalculator {
    // 正态分布
    static normalPDF(x, mu, sigma) {
        const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
        const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
        return coefficient * Math.exp(exponent);
    }

    static normalCharacteristics(mu, sigma) {
        const variance = Math.pow(sigma, 2);
        return {
            mean: mu,
            variance: variance,
            skewness: 0,
            kurtosis: 3,
            median: mu,
            mode: mu,
            mgf: `exp(μt + σ²t²/2)`,
            chf: `exp(iμt - σ²t²/2)`,
            percentile25: mu - 0.6745 * sigma,
            percentile75: mu + 0.6745 * sigma
        };
    }

    // 对数正态分布
    static lognormalPDF(x, mu, sigma) {
        if (x <= 0) return 0;
        const coefficient = 1 / (x * sigma * Math.sqrt(2 * Math.PI));
        const exponent = -Math.pow(Math.log(x) - mu, 2) / (2 * Math.pow(sigma, 2));
        return coefficient * Math.exp(exponent);
    }

    static lognormalCharacteristics(mu, sigma) {
        const variance_log = Math.pow(sigma, 2);
        const mean = Math.exp(mu + variance_log / 2);
        const variance = (Math.exp(variance_log) - 1) * Math.exp(2 * mu + variance_log);
        const skewness = (Math.exp(variance_log) + 2) * Math.sqrt(Math.exp(variance_log) - 1);
        const kurtosis = Math.exp(4 * variance_log) + 2 * Math.exp(3 * variance_log) + 3 * Math.exp(2 * variance_log) - 6;
        
        return {
            mean: mean.toFixed(4),
            variance: variance.toFixed(4),
            skewness: skewness.toFixed(4),
            kurtosis: kurtosis.toFixed(4),
            median: Math.exp(mu).toFixed(4),
            mode: Math.exp(mu - variance_log).toFixed(4),
            mgf: `不存在`,
            chf: `复杂表达式`,
            percentile25: Math.exp(mu - 0.6745 * sigma).toFixed(4),
            percentile75: Math.exp(mu + 0.6745 * sigma).toFixed(4)
        };
    }

    // 指数分布
    static exponentialPDF(x, lambda) {
        if (x < 0) return 0;
        return lambda * Math.exp(-lambda * x);
    }

    static exponentialCharacteristics(lambda) {
        const mean = 1 / lambda;
        const variance = 1 / Math.pow(lambda, 2);
        
        return {
            mean: mean.toFixed(4),
            variance: variance.toFixed(4),
            skewness: 2,
            kurtosis: 9,
            median: (Math.log(2) / lambda).toFixed(4),
            mode: 0,
            mgf: `λ/(λ-t), t < λ`,
            chf: `λ/(λ-it)`,
            percentile25: (Math.log(4/3) / lambda).toFixed(4),
            percentile75: (Math.log(4) / lambda).toFixed(4)
        };
    }

    // 伽马分布
    static gammaPDF(x, alpha, beta) {
        if (x <= 0) return 0;
        const coefficient = Math.pow(beta, alpha) / gamma(alpha);
        return coefficient * Math.pow(x, alpha - 1) * Math.exp(-beta * x);
    }

    static gammaCharacteristics(alpha, beta) {
        const mean = alpha / beta;
        const variance = alpha / Math.pow(beta, 2);
        const skewness = 2 / Math.sqrt(alpha);
        const kurtosis = 3 + 6 / alpha;
        
        return {
            mean: mean.toFixed(4),
            variance: variance.toFixed(4),
            skewness: skewness.toFixed(4),
            kurtosis: kurtosis.toFixed(4),
            median: "复杂表达式",
            mode: alpha > 1 ? ((alpha - 1) / beta).toFixed(4) : 0,
            mgf: `(β/(β-t))^α, t < β`,
            chf: `(β/(β-it))^α`,
            percentile25: "数值计算",
            percentile75: "数值计算"
        };
    }

    // 帕累托分布
    static paretoPDF(x, alpha, xm) {
        if (x < xm) return 0;
        return (alpha * Math.pow(xm, alpha)) / Math.pow(x, alpha + 1);
    }

    static paretoCharacteristics(alpha, xm) {
        const mean = alpha > 1 ? (alpha * xm / (alpha - 1)).toFixed(4) : "不存在";
        const variance = alpha > 2 ? (xm * xm * alpha / ((alpha - 1) * (alpha - 1) * (alpha - 2))).toFixed(4) : "不存在";
        const skewness = alpha > 3 ? (2 * (1 + alpha) / (alpha - 3) * Math.sqrt((alpha - 2) / alpha)).toFixed(4) : "不存在";
        
        return {
            mean: mean,
            variance: variance,
            skewness: skewness,
            kurtosis: alpha > 4 ? "复杂表达式" : "不存在",
            median: (xm * Math.pow(2, 1/alpha)).toFixed(4),
            mode: xm,
            mgf: "不存在",
            chf: "复杂表达式",
            percentile25: (xm * Math.pow(4/3, 1/alpha)).toFixed(4),
            percentile75: (xm * Math.pow(4, 1/alpha)).toFixed(4)
        };
    }

    // 韦伯分布
    static weibullPDF(x, k, lambda) {
        if (x < 0) return 0;
        const ratio = x / lambda;
        return (k / lambda) * Math.pow(ratio, k - 1) * Math.exp(-Math.pow(ratio, k));
    }

    static weibullCharacteristics(k, lambda) {
        const mean = lambda * gamma(1 + 1/k);
        const variance = Math.pow(lambda, 2) * (gamma(1 + 2/k) - Math.pow(gamma(1 + 1/k), 2));
        const median = lambda * Math.pow(Math.log(2), 1/k);
        const mode = k > 1 ? lambda * Math.pow((k-1)/k, 1/k) : 0;
        
        return {
            mean: mean.toFixed(4),
            variance: variance.toFixed(4),
            skewness: "复杂表达式",
            kurtosis: "复杂表达式",
            median: median.toFixed(4),
            mode: mode.toFixed(4),
            mgf: "复杂表达式",
            chf: "复杂表达式",
            percentile25: (lambda * Math.pow(Math.log(4/3), 1/k)).toFixed(4),
            percentile75: (lambda * Math.pow(Math.log(4), 1/k)).toFixed(4)
        };
    }

    // Burr分布
    static burrPDF(x, c, k, sigma) {
        if (x <= 0) return 0;
        const ratio = x / sigma;
        const numerator = (c * k / sigma) * Math.pow(ratio, c - 1);
        const denominator = Math.pow(1 + Math.pow(ratio, c), k + 1);
        return numerator / denominator;
    }

    static burrCharacteristics(c, k, sigma) {
        const mean = k > 1/c ? (sigma * gamma(k - 1/c) * gamma(1 + 1/c) / gamma(k)).toFixed(4) : "不存在";
        
        return {
            mean: mean,
            variance: "复杂表达式",
            skewness: "复杂表达式",
            kurtosis: "复杂表达式",
            median: (sigma * Math.pow(Math.pow(2, 1/k) - 1, 1/c)).toFixed(4),
            mode: c > 1 ? (sigma * Math.pow((c-1)/(k*c+1), 1/c)).toFixed(4) : 0,
            mgf: "复杂表达式",
            chf: "复杂表达式",
            percentile25: "数值计算",
            percentile75: "数值计算"
        };
    }
}

// 绘图函数
function plotDistribution(distribution, containerId) {
    let x = [];
    let y = [];
    let params = getParameters(distribution);
    
    // 根据分布类型设置x轴范围
    let xMin, xMax, step;
    
    switch(distribution) {
        case 'normal':
            xMin = params.mu - 4 * params.sigma;
            xMax = params.mu + 4 * params.sigma;
            step = (xMax - xMin) / 1000;
            break;
        case 'lognormal':
            xMin = 0.01;
            xMax = Math.exp(params.mu + 3 * params.sigma);
            step = (xMax - xMin) / 1000;
            break;
        case 'exponential':
            xMin = 0;
            xMax = 5 / params.lambda;
            step = (xMax - xMin) / 1000;
            break;
        case 'gamma':
            xMin = 0.01;
            xMax = (params.alpha + 3 * Math.sqrt(params.alpha)) / params.beta;
            step = (xMax - xMin) / 1000;
            break;
        case 'pareto':
            xMin = params.xm;
            xMax = params.xm * 10;
            step = (xMax - xMin) / 1000;
            break;
        case 'weibull':
            xMin = 0;
            xMax = params.lambda * 3;
            step = (xMax - xMin) / 1000;
            break;
        case 'burr':
            xMin = 0.01;
            xMax = params.sigma * 5;
            step = (xMax - xMin) / 1000;
            break;
    }
    
    // 生成数据点
    for (let i = 0; i <= 1000; i++) {
        let xi = xMin + i * step;
        let yi;
        
        switch(distribution) {
            case 'normal':
                yi = DistributionCalculator.normalPDF(xi, params.mu, params.sigma);
                break;
            case 'lognormal':
                yi = DistributionCalculator.lognormalPDF(xi, params.mu, params.sigma);
                break;
            case 'exponential':
                yi = DistributionCalculator.exponentialPDF(xi, params.lambda);
                break;
            case 'gamma':
                yi = DistributionCalculator.gammaPDF(xi, params.alpha, params.beta);
                break;
            case 'pareto':
                yi = DistributionCalculator.paretoPDF(xi, params.alpha, params.xm);
                break;
            case 'weibull':
                yi = DistributionCalculator.weibullPDF(xi, params.k, params.lambda);
                break;
            case 'burr':
                yi = DistributionCalculator.burrPDF(xi, params.c, params.k, params.sigma);
                break;
        }
        
        x.push(xi);
        y.push(yi);
    }
    
    // 绘制图形
    const trace = {
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines',
        line: {
            color: '#4facfe',
            width: 3
        },
        name: '概率密度函数'
    };
    
    const layout = {
        title: {
            text: `${getDistributionName(distribution)} - 概率密度函数`,
            font: { size: 18, color: '#2c3e50' }
        },
        xaxis: {
            title: 'x',
            gridcolor: '#e9ecef'
        },
        yaxis: {
            title: 'f(x)',
            gridcolor: '#e9ecef'
        },
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: 'white',
        margin: { t: 60, r: 30, b: 60, l: 60 }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(containerId, [trace], layout, config);
}

// 获取参数值
function getParameters(distribution) {
    switch(distribution) {
        case 'normal':
            return {
                mu: parseFloat(document.getElementById('normal-mu').value),
                sigma: parseFloat(document.getElementById('normal-sigma').value)
            };
        case 'lognormal':
            return {
                mu: parseFloat(document.getElementById('lognormal-mu').value),
                sigma: parseFloat(document.getElementById('lognormal-sigma').value)
            };
        case 'exponential':
            return {
                lambda: parseFloat(document.getElementById('exponential-lambda').value)
            };
        case 'gamma':
            return {
                alpha: parseFloat(document.getElementById('gamma-alpha').value),
                beta: parseFloat(document.getElementById('gamma-beta').value)
            };
        case 'pareto':
            return {
                alpha: parseFloat(document.getElementById('pareto-alpha').value),
                xm: parseFloat(document.getElementById('pareto-xm').value)
            };
        case 'weibull':
            return {
                k: parseFloat(document.getElementById('weibull-k').value),
                lambda: parseFloat(document.getElementById('weibull-lambda').value)
            };
        case 'burr':
            return {
                c: parseFloat(document.getElementById('burr-c').value),
                k: parseFloat(document.getElementById('burr-k').value),
                sigma: parseFloat(document.getElementById('burr-sigma').value)
            };
    }
}

// 获取分布名称
function getDistributionName(distribution) {
    const names = {
        'normal': '正态分布',
        'lognormal': '对数正态分布',
        'exponential': '指数分布',
        'gamma': '伽马分布',
        'pareto': '帕累托分布',
        'weibull': '韦伯分布',
        'burr': 'Burr分布'
    };
    return names[distribution];
}

// 更新特征值显示
function updateCharacteristics(distribution) {
    let characteristics;
    let params = getParameters(distribution);
    
    switch(distribution) {
        case 'normal':
            characteristics = DistributionCalculator.normalCharacteristics(params.mu, params.sigma);
            break;
        case 'lognormal':
            characteristics = DistributionCalculator.lognormalCharacteristics(params.mu, params.sigma);
            break;
        case 'exponential':
            characteristics = DistributionCalculator.exponentialCharacteristics(params.lambda);
            break;
        case 'gamma':
            characteristics = DistributionCalculator.gammaCharacteristics(params.alpha, params.beta);
            break;
        case 'pareto':
            characteristics = DistributionCalculator.paretoCharacteristics(params.alpha, params.xm);
            break;
        case 'weibull':
            characteristics = DistributionCalculator.weibullCharacteristics(params.k, params.lambda);
            break;
        case 'burr':
            characteristics = DistributionCalculator.burrCharacteristics(params.c, params.k, params.sigma);
            break;
    }
    
    const container = document.getElementById(`${distribution}-characteristics`);
    container.innerHTML = `
        <div class="char-item"><strong>均值:</strong> ${characteristics.mean}</div>
        <div class="char-item"><strong>方差:</strong> ${characteristics.variance}</div>
        <div class="char-item"><strong>偏度:</strong> ${characteristics.skewness}</div>
        <div class="char-item"><strong>峰度:</strong> ${characteristics.kurtosis}</div>
        <div class="char-item"><strong>中位数:</strong> ${characteristics.median}</div>
        <div class="char-item"><strong>众数:</strong> ${characteristics.mode}</div>
        <div class="char-item"><strong>MGF:</strong> ${characteristics.mgf}</div>
        <div class="char-item"><strong>特征函数:</strong> ${characteristics.chf}</div>
        <div class="char-item"><strong>25%分位数:</strong> ${characteristics.percentile25}</div>
        <div class="char-item"><strong>75%分位数:</strong> ${characteristics.percentile75}</div>
    `;
}

// 更新图形和特征值
function updatePlot(distribution) {
    plotDistribution(distribution, `${distribution}-plot`);
    updateCharacteristics(distribution);
}

// 切换分布显示
function switchDistribution(distribution) {
    // 隐藏所有分布信息
    document.querySelectorAll('.distribution-info').forEach(info => {
        info.classList.remove('active');
    });
    
    // 移除所有按钮的active类
    document.querySelectorAll('.distribution-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的分布信息
    document.getElementById(distribution).classList.add('active');
    document.querySelector(`[data-distribution="${distribution}"]`).classList.add('active');
    
    // 重新渲染MathJax公式
    if (window.MathJax) {
        MathJax.typesetPromise([document.getElementById(distribution)]).then(() => {
            // MathJax渲染完成后更新图形和特征值
            updatePlot(distribution);
        }).catch((err) => {
            console.log('MathJax渲染错误:', err.message);
            updatePlot(distribution);
        });
    } else {
        // 如果MathJax未加载，直接更新
        updatePlot(distribution);
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 分布按钮点击事件
    document.querySelectorAll('.distribution-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const distribution = this.getAttribute('data-distribution');
            switchDistribution(distribution);
        });
    });
    
    // 参数输入变化事件
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            // 防抖处理
            clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => {
                const distribution = this.id.split('-')[0];
                updatePlot(distribution);
            }, 500);
        });
    });
    
    // 等待MathJax加载完成后初始化
    if (window.MathJax) {
        MathJax.startup.promise.then(() => {
            // MathJax加载完成，渲染所有公式
            MathJax.typesetPromise().then(() => {
                // 初始化正态分布
                updatePlot('normal');
            });
        });
    } else {
        // 如果MathJax未加载，直接初始化
        setTimeout(() => {
            updatePlot('normal');
        }, 1000);
    }
});

// 下载功能
function downloadFile(filename) {
    let content = '';
    let mimeType = '';
    
    if (filename === 'index.html') {
        content = document.documentElement.outerHTML;
        mimeType = 'text/html';
    } else if (filename === 'distributions.js') {
        // 获取JavaScript文件内容
        fetch('distributions.js')
            .then(response => response.text())
            .then(jsContent => {
                downloadContent(jsContent, filename, 'text/javascript');
            })
            .catch(error => {
                console.error('获取JavaScript文件失败:', error);
                alert('下载失败，请手动复制文件');
            });
        return;
    }
    
    downloadContent(content, filename, mimeType);
}

function downloadContent(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function downloadAllFiles() {
    // 下载HTML文件
    downloadFile('index.html');
    
    // 延迟下载JavaScript文件
    setTimeout(() => {
        downloadFile('distributions.js');
    }, 500);
    
    // 创建README文件
    const readmeContent = `# 统计分布可视化网页

这是一个交互式的统计分布可视化网页应用，包含以下功能：

## 支持的分布
- 正态分布 (Normal Distribution)
- 对数正态分布 (Lognormal Distribution)
- 指数分布 (Exponential Distribution)
- 伽马分布 (Gamma Distribution)
- 帕累托分布 (Pareto Distribution)
- 韦伯分布 (Weibull Distribution)
- Burr分布 (Burr Distribution)

## 功能特性
- 交互式参数调整
- 实时概率密度函数图形更新
- 完整的数值特征显示（均值、方差、偏度、峰度等）
- 专业的LaTeX数学公式显示
- 响应式设计

## 使用方法
1. 在浏览器中打开 index.html 文件
2. 点击左侧分布名称切换不同分布
3. 调整参数值观察分布变化
4. 查看相应的数值特征

## 技术栈
- HTML5 + CSS3
- JavaScript (ES6+)
- Plotly.js (图形绘制)
- MathJax (数学公式渲染)
- Math.js (数学计算)

## 文件说明
- index.html: 主网页文件
- distributions.js: JavaScript功能实现
- README.md: 说明文档

创建时间: ${new Date().toLocaleString('zh-CN')}
`;
    
    setTimeout(() => {
        downloadContent(readmeContent, 'README.md', 'text/markdown');
    }, 1000);
    
    alert('开始下载所有文件，请稍等...');
}