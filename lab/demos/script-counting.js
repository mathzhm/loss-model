// 泊松过程间隔时间分布图表
const poissonCtx = document.getElementById('poissonChart').getContext('2d');
const poissonChart = new Chart(poissonCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: '间隔时间分布',
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '概率密度'
                }
            },
            x: {
                title: {
                    display: true,
                    text: '间隔时间'
                }
            }
        }
    }
});

// 非齐次泊松过程强度函数图表
const nonHomogeneousCtx = document.getElementById('nonHomogeneousChart').getContext('2d');
const nonHomogeneousChart = new Chart(nonHomogeneousCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '强度函数 λ(t)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            fill: false
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '强度 λ(t)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: '时间 t'
                }
            }
        }
    }
});

// 更新泊松过程图表
function updatePoissonChart(lambda) {
    const xValues = Array.from({length: 20}, (_, i) => i * 0.2);
    const yValues = xValues.map(x => lambda * Math.exp(-lambda * x));
    
    poissonChart.data.labels = xValues;
    poissonChart.data.datasets[0].data = yValues;
    poissonChart.update();
}

// 更新非齐次泊松过程图表
function updateNonHomogeneousChart(type) {
    const xValues = Array.from({length: 100}, (_, i) => i / 10);
    let yValues;
    
    switch(type) {
        case 'sin':
            yValues = xValues.map(x => 1 + 0.5 * Math.sin(x));
            break;
        case 'linear':
            yValues = xValues.map(x => 0.5 + 0.1 * x);
            break;
        case 'quadratic':
            yValues = xValues.map(x => 0.5 + 0.01 * x * x);
            break;
    }
    
    nonHomogeneousChart.data.labels = xValues;
    nonHomogeneousChart.data.datasets[0].data = yValues;
    nonHomogeneousChart.update();
}

// 事件图表
const eventCtx = document.getElementById('eventChart').getContext('2d');
let eventChart = new Chart(eventCtx, {
    type: 'scatter',
    data: {
        datasets: [{
            label: '事件强度',
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderWidth: 1,
            pointRadius: 5,
            data: []
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '强度 λ(t)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: '时间 t'
                }
            }
        }
    }
});

// 事件模拟
let animationId;
let events = [];
let startTime;

function startAnimation() {
    resetAnimation();
    startTime = Date.now();
    const lambda = parseFloat(document.getElementById('lambda').value);
    const intensityType = document.getElementById('intensityFunction').value;
    
    function generateEvent() {
        const currentTime = (Date.now() - startTime) / 1000;
        let lambdaValue;
        
        // 根据选择的强度函数计算当前λ值
        switch(intensityType) {
            case 'sin':
                lambdaValue = lambda * (1 + 0.5 * Math.sin(currentTime));
                break;
            case 'linear':
                lambdaValue = lambda * (0.5 + 0.1 * currentTime);
                break;
            case 'quadratic':
                lambdaValue = lambda * (0.5 + 0.01 * currentTime * currentTime);
                break;
            default:
                lambdaValue = lambda;
        }
        
        // 生成下一个事件时间
        const u = Math.random();
        const interval = -Math.log(u) / lambdaValue;
        
        const eventTime = currentTime + interval;
        events.push({time: eventTime, intensity: lambdaValue});
        
        // 更新图表
        eventChart.data.datasets[0].data = events.map(e => ({
            x: e.time,
            y: e.intensity
        }));
        eventChart.update();
        
        // 安排下一个事件
        animationId = setTimeout(generateEvent, interval * 1000);
    }
    
    generateEvent();
}

function resetAnimation() {
    if (animationId) clearTimeout(animationId);
    events = [];
    eventChart.data.datasets[0].data = [];
    eventChart.update();
}

// 事件监听
document.getElementById('lambda').addEventListener('input', function() {
    const lambda = parseFloat(this.value);
    document.getElementById('lambdaValue').textContent = lambda.toFixed(1);
    updatePoissonChart(lambda);
});

document.getElementById('intensityFunction').addEventListener('change', function() {
    updateNonHomogeneousChart(this.value);
});

document.getElementById('startAnimation').addEventListener('click', startAnimation);
document.getElementById('resetAnimation').addEventListener('click', resetAnimation);

// 初始化图表
updatePoissonChart(1);
updateNonHomogeneousChart('sin');