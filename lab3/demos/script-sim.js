let chart;

function simulate() {
    const lambda = parseFloat(document.getElementById('lambda').value);
    const jumpMean = parseFloat(document.getElementById('jumpMean').value);
    
    const seed = document.getElementById('seed').value;

    if (seed) {
        Math.seedrandom(seed);
    }

    // 生成复合泊松过程
    const timeSteps = 100;
    const timeInterval = 1;
    const process = [0];
    const jumps = [];
    let currentTime = 0;
    let currentValue = 0;

    for (let i = 1; i <= timeSteps; i++) {
        currentTime += timeInterval;
        const poissonCount = poissonRandom(lambda * timeInterval);
        let jumpSum = 0;
        for (let j = 0; j < poissonCount; j++) {
            const jump = exponentialRandom(jumpMean);
            jumpSum += jump;
            jumps.push(jump);
        }
        currentValue += jumpSum;
        process.push(currentValue);
    }

    // 绘制图表
    const ctx = document.getElementById('chart').getContext('2d');
    if (chart) {
        chart.destroy();
    }
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: timeSteps + 1 }, (_, i) => i * timeInterval),
            datasets: [{
                label: '复合泊松过程',
                data: process,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    alert(`时间点 ${index}: 累计值 = ${process[index].toFixed(2)}`);
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '时间'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '累计值'
                    }
                }
            }
        }
    });

    // 计算统计量
    const mean = jumps.reduce((a, b) => a + b, 0) / jumps.length;
    const variance = jumps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / jumps.length;
    const stdDev = Math.sqrt(variance);
    const skewness = jumps.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 3), 0) / jumps.length;
    const kurtosis = jumps.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 4), 0) / jumps.length - 3;

    document.getElementById('stats').innerHTML = `
        <h3>统计指标</h3>
        <table>
            <tr>
                <th>指标</th>
                <th>值</th>
                <th>说明</th>
            </tr>
            <tr>
                <td>跳跃次数</td>
                <td>${jumps.length}</td>
                <td>事件发生的总次数</td>
            </tr>
            <tr>
                <td>跳跃均值</td>
                <td>${mean.toFixed(2)}</td>
                <td>平均每次跳跃的大小</td>
            </tr>
            <tr>
                <td>跳跃标准差</td>
                <td>${stdDev.toFixed(2)}</td>
                <td>跳跃大小的波动性</td>
            </tr>
            <tr>
                <td>偏度</td>
                <td>${skewness.toFixed(2)}</td>
                <td>分布的不对称性（>0 右偏，<0 左偏）</td>
            </tr>
            <tr>
                <td>峰度</td>
                <td>${kurtosis.toFixed(2)}</td>
                <td>分布的尖锐程度（>0 比正态分布更尖锐）</td>
            </tr>
            <tr>
                <td>过程终值</td>
                <td>${currentValue.toFixed(2)}</td>
                <td>模拟结束时的累计值</td>
            </tr>
        </table>
    `;
}

// 泊松随机数生成
function poissonRandom(lambda) {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

// 指数随机数生成
function exponentialRandom(mean) {
    return -mean * Math.log(1 - Math.random());
}