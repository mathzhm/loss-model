class IndividualRiskModel {
    constructor() {
        this.realTimeMode = true; // 默认开启实时计算
        this.currentScenario = 'custom';
        this.scenarios = {
            conservative: { policyCount: 50, claimAmount: 80000, damageProbability: 0.005, damageType: 'full' },
            moderate: { policyCount: 100, claimAmount: 100000, damageProbability: 0.01, damageType: 'full' },
            aggressive: { policyCount: 200, claimAmount: 150000, damageProbability: 0.02, damageType: 'full' }
        };
        
        this.initializeEventListeners();
        this.initializeCharts();
        this.loadSavedSettings();
        this.probabilityData = [];
        
        // 立即更新实时计算按钮状态
        setTimeout(() => {
            this.updateRealTimeButton();
        }, 100);
    }

    initializeEventListeners() {
        const calculateBtn = document.getElementById('calculateBtn');
        const realTimeToggle = document.getElementById('realTimeToggle');
        const exportBtn = document.getElementById('exportBtn');
        const resetBtn = document.getElementById('resetBtn');
        const saveScenarioBtn = document.getElementById('saveScenarioBtn');
        const damageTypeSelect = document.getElementById('damageType');
        const partialDamageGroup = document.getElementById('partialDamageGroup');
        const mixedDamageGroup = document.getElementById('mixedDamageGroup');
        const damageProbabilitySlider = document.getElementById('damageProbability');
        const damageProbabilityValue = document.getElementById('damageProbabilityValue');
        const scenarioButtons = document.querySelectorAll('.scenario-btn');
        const riskThresholdInput = document.getElementById('riskThreshold');
        const warningThresholdInput = document.getElementById('warningThreshold');

        // 基础事件监听
        calculateBtn.addEventListener('click', () => this.calculate());
        
        // 实时计算切换
        realTimeToggle.addEventListener('click', () => this.toggleRealTimeMode());
        
        // 导出功能
        exportBtn.addEventListener('click', () => this.exportReport());
        
        // 重置参数
        resetBtn.addEventListener('click', () => this.resetParameters());
        
        // 保存情景
        saveScenarioBtn.addEventListener('click', () => this.saveCurrentScenario());
        
        // 情景选择
        scenarioButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('情景按钮被点击:', e.target.dataset.scenario);
                this.selectScenario(e.target.dataset.scenario);
            });
        });
        
        // 初始选中自定义情景
        this.selectScenario('custom');

        // 损毁类型切换
        damageTypeSelect.addEventListener('change', (e) => {
            partialDamageGroup.style.display = 'none';
            mixedDamageGroup.style.display = 'none';
            
            if (e.target.value === 'partial') {
                partialDamageGroup.style.display = 'block';
            } else if (e.target.value === 'mixed') {
                mixedDamageGroup.style.display = 'block';
            }
            
            if (this.realTimeMode) this.calculate();
        });

        // 范围滑块事件
        damageProbabilitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            damageProbabilityValue.textContent = value.toFixed(3);
            document.querySelector('.range-percent').textContent = `(${(value * 100).toFixed(1)}%)`;
            
            if (this.realTimeMode) this.calculate();
        });

        // 风险阈值设置 - 加强事件监听
        riskThresholdInput.addEventListener('input', () => {
            this.updateRiskStatusIndicator(); // 立即更新状态显示
            if (this.realTimeMode) this.calculate();
            this.saveSettings();
        });
        
        riskThresholdInput.addEventListener('change', () => {
            this.updateRiskStatusIndicator(); // 确保状态更新
            if (this.realTimeMode) this.calculate();
            this.saveSettings();
        });
        
        warningThresholdInput.addEventListener('input', () => {
            this.updateRiskStatusIndicator(); // 立即更新状态显示
            if (this.realTimeMode) this.calculate();
            this.saveSettings();
        });
        
        warningThresholdInput.addEventListener('change', () => {
            this.updateRiskStatusIndicator(); // 确保状态更新
            if (this.realTimeMode) this.calculate();
            this.saveSettings();
        });

        // 实时计算输入监听
        const realTimeInputs = [
            'policyCount', 'claimAmount', 'partialRatio', 
            'fullDamageProb', 'partialDamageProb', 'mixedPartialRatio'
        ];
        
        realTimeInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    if (this.realTimeMode) {
                        this.calculate();
                    }
                });
                
                // 添加change事件监听，确保所有输入变化都能触发
                input.addEventListener('change', () => {
                    if (this.realTimeMode) {
                        this.calculate();
                    }
                });
            }
        });
        
        // 为所有输入框添加实时计算支持
        document.querySelectorAll('input[type="number"], input[type="range"], select').forEach(input => {
            if (!realTimeInputs.includes(input.id)) {
                input.addEventListener('input', () => {
                    if (this.realTimeMode) {
                        this.calculate();
                    }
                });
                
                input.addEventListener('change', () => {
                    if (this.realTimeMode) {
                        this.calculate();
                    }
                });
            }
        });
        
        // 初始更新滑块显示
        this.updateProbabilityChartData();
    }

    updateRealTimeButton() {
        const toggleBtn = document.getElementById('realTimeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = `实时计算：${this.realTimeMode ? '开启' : '关闭'}`;
            toggleBtn.classList.toggle('active', this.realTimeMode);
        }
    }

    toggleRealTimeMode() {
        this.realTimeMode = !this.realTimeMode;
        this.updateRealTimeButton();
        
        if (this.realTimeMode) {
            this.calculate();
            this.showNotification('实时计算已开启', 'success');
        } else {
            this.showNotification('实时计算已关闭', 'info');
        }
    }

    selectScenario(scenario) {
        console.log('选择情景:', scenario);
        this.currentScenario = scenario;
        
        // 更新情景按钮状态
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            const isActive = btn.dataset.scenario === scenario;
            btn.classList.toggle('active', isActive);
            console.log('按钮状态:', btn.dataset.scenario, isActive);
        });
        
        // 更新情景信息
        const scenarioInfo = document.querySelector('#scenarioInfo span');
        if (scenarioInfo) {
            scenarioInfo.textContent = `当前情景：${this.getScenarioName(scenario)}`;
        }
        
        if (scenario !== 'custom') {
            const params = this.scenarios[scenario];
            console.log('应用情景参数:', params);
            this.setInputValues(params);
            if (this.realTimeMode) {
                setTimeout(() => this.calculate(), 100);
            }
        }
        
        this.saveSettings();
    }

    getScenarioName(scenario) {
        const names = {
            conservative: '保守情景',
            moderate: '中性情景', 
            aggressive: '激进情景',
            custom: '自定义'
        };
        return names[scenario] || '自定义';
    }

    setInputValues(params) {
        document.getElementById('policyCount').value = params.policyCount;
        document.getElementById('claimAmount').value = params.claimAmount;
        document.getElementById('damageProbability').value = params.damageProbability;
        document.getElementById('damageType').value = params.damageType;
        
        // 触发损毁类型变化事件
        document.getElementById('damageType').dispatchEvent(new Event('change'));
        
        // 更新滑块显示
        this.updateProbabilityChartData();
    }

    saveCurrentScenario() {
        const params = this.getInputValues();
        this.scenarios.custom = params;
        this.saveSettings();
        
        // 显示保存成功提示
        this.showNotification('情景配置已保存', 'success');
    }

    initializeCharts() {
        // 分布图表
        this.distributionChart = new Chart(
            document.getElementById('distributionChart').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: ['期望损失 E(S)', '损失方差 Var(S)'],
                    datasets: [{
                        label: '当前损毁类型',
                        data: [0, 0],
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '金额（元）'
                            }
                        }
                    }
                }
            }
        );

        // 概率变化图表
        this.probabilityChart = new Chart(
            document.getElementById('probabilityChart').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: '期望损失 E(S)',
                            data: [],
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: '损失方差 Var(S)',
                            data: [],
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '金额（元）'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '损毁概率 q'
                            }
                        }
                    }
                }
            }
        );

        // 模拟图表
        this.simulationChart = new Chart(
            document.getElementById('simulationChart').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: '损失频率',
                        data: [],
                        backgroundColor: 'rgba(153, 102, 255, 0.8)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '频率'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '损失金额（元）'
                            }
                        }
                    }
                }
            }
        );

        // 对比图表
        this.comparisonChart = new Chart(
            document.getElementById('comparisonChart').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: ['全部损毁', '部分损毁', '混合损毁'],
                    datasets: [
                        {
                            label: '期望损失 E(S)',
                            data: [0, 0, 0],
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: '损失方差 Var(S)',
                            data: [0, 0, 0],
                            backgroundColor: 'rgba(255, 99, 132, 0.8)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '金额（元）'
                            }
                        }
                    }
                }
            }
        );
    }

    getInputValues() {
        const baseParams = {
            policyCount: parseInt(document.getElementById('policyCount').value),
            claimAmount: parseFloat(document.getElementById('claimAmount').value),
            damageProbability: parseFloat(document.getElementById('damageProbability').value),
            damageType: document.getElementById('damageType').value
        };

        if (baseParams.damageType === 'partial') {
            baseParams.partialRatio = parseFloat(document.getElementById('partialRatio').value);
        } else if (baseParams.damageType === 'mixed') {
            baseParams.fullDamageProb = parseFloat(document.getElementById('fullDamageProb').value);
            baseParams.partialDamageProb = parseFloat(document.getElementById('partialDamageProb').value);
            baseParams.mixedPartialRatio = parseFloat(document.getElementById('mixedPartialRatio').value);
        }

        return baseParams;
    }

    calculateMean(params) {
        const { policyCount, claimAmount, damageProbability, damageType } = params;
        
        if (damageType === 'full') {
            // 全部损毁: E[Xi] = q·c
            const E_Xi = damageProbability * claimAmount;
            return policyCount * E_Xi;
        } else if (damageType === 'partial') {
            // 部分损毁: E[Xi] = q·αc
            const { partialRatio } = params;
            const E_Xi = damageProbability * claimAmount * partialRatio;
            return policyCount * E_Xi;
        } else {
            // 混合损毁: E[Xi] = q₁c + q₂αc
            const { fullDamageProb, partialDamageProb, mixedPartialRatio } = params;
            const E_Xi = fullDamageProb * claimAmount + partialDamageProb * claimAmount * mixedPartialRatio;
            return policyCount * E_Xi;
        }
    }

    calculateVariance(params) {
        const { policyCount, claimAmount, damageProbability, damageType } = params;
        
        if (damageType === 'full') {
            // 全部损毁: Var[Xi] = q(1-q)c²
            const Var_Xi = damageProbability * (1 - damageProbability) * Math.pow(claimAmount, 2);
            return policyCount * Var_Xi;
        } else if (damageType === 'partial') {
            // 部分损毁: Var[Xi] = q(1-q)(αc)²
            const { partialRatio } = params;
            const Var_Xi = damageProbability * (1 - damageProbability) * Math.pow(claimAmount * partialRatio, 2);
            return policyCount * Var_Xi;
        } else {
            // 混合损毁: Var[Xi] = q₁c² + q₂(αc)² - (E[Xi])²
            const { fullDamageProb, partialDamageProb, mixedPartialRatio } = params;
            const E_Xi = fullDamageProb * claimAmount + partialDamageProb * claimAmount * mixedPartialRatio;
            const Var_Xi = fullDamageProb * Math.pow(claimAmount, 2) + 
                          partialDamageProb * Math.pow(claimAmount * mixedPartialRatio, 2) - 
                          Math.pow(E_Xi, 2);
            return policyCount * Var_Xi;
        }
    }

    calculate() {
        console.log('开始计算...');
        const params = this.getInputValues();
        console.log('输入参数:', params);
        
        // 验证输入
        if (!this.validateInputs(params)) {
            console.log('输入验证失败');
            return;
        }

        // 计算统计量
        const mean = this.calculateMean(params);
        const variance = this.calculateVariance(params);
        const stdDev = Math.sqrt(variance);
        
        // 添加零值保护，避免除零错误
        let cv = 0;
        if (mean > 0) {
            cv = stdDev / mean;
        } else {
            cv = stdDev > 0 ? Infinity : 0; // 如果mean=0，标准差>0，则CV为无穷大
        }

        // 调试信息：查看具体参数和计算结果
        console.log('计算参数:', params);
        console.log('计算结果:', { mean, variance, stdDev, cv, cvPercent: cv * 100 });
        console.log('当前阈值:', { 
            warningThreshold: parseFloat(document.getElementById('warningThreshold').value),
            riskThreshold: parseFloat(document.getElementById('riskThreshold').value) 
        });
        
        // 检查CV值是否合理，如果CV很大，说明相对风险很高
        if (cv > 100) {
            console.warn('CV值异常大，相对风险非常高');
        }
        
        // 添加CV值范围的合理性检查
        if (cv > 10) {
            console.warn('CV值异常大，可能是参数设置不合理');
        }

        // 更新结果显示
        this.updateResults(mean, variance, stdDev, cv);
        
        // 更新图表
        this.updateCharts(mean, variance, params);
        
        // 添加动画效果
        this.animateResults();
        
        console.log('计算完成');
    }

    validateInputs(params) {
        const { policyCount, claimAmount, damageProbability } = params;
        
        if (policyCount <= 0 || policyCount > 10000) {
            alert('保单数量必须在1-10000之间');
            return false;
        }
        
        if (claimAmount <= 0) {
            alert('赔付金额必须大于0');
            return false;
        }
        
        if (damageProbability < 0 || damageProbability > 1) {
            alert('损毁概率必须在0-1之间');
            return false;
        }
        
        return true;
    }

    updateResults(mean, variance, stdDev, cv) {
        document.getElementById('meanResult').textContent = this.formatNumber(mean) + ' 元';
        document.getElementById('varianceResult').textContent = this.formatNumber(variance) + ' 元²';
        document.getElementById('stdDevResult').textContent = this.formatNumber(stdDev) + ' 元';
        document.getElementById('cvResult').textContent = this.formatNumber(cv * 100) + ' %';
        
        // 更新风险状态
        this.updateRiskStatus(cv);
        
        // 更新分析总结
        this.updateAnalysisSummary(mean, variance, stdDev, cv);
    }

    updateRiskStatus(cv) {
        const cvPercent = cv * 100;
        const warningThreshold = parseFloat(document.getElementById('warningThreshold').value);
        const riskThreshold = parseFloat(document.getElementById('riskThreshold').value);
        
        console.log('风险状态判断:', { cvPercent, warningThreshold, riskThreshold });
        
        const statusElement = document.getElementById('thresholdStatus');
        let statusClass = 'safe';
        let statusText = '风险状态：安全';
        let thresholdInfo = '';
        
        // 更精细的风险状态判断逻辑
        if (cvPercent >= riskThreshold) {
            statusClass = 'danger';
            statusText = `风险状态：危险（CV=${cvPercent.toFixed(2)}% ≥ ${riskThreshold}%）`;
            thresholdInfo = `<span class="threshold-detail">当前风险水平已超过设定的风险阈值！</span>`;
        } else if (cvPercent >= warningThreshold) {
            statusClass = 'warning';
            statusText = `风险状态：预警（CV=${cvPercent.toFixed(2)}% ≥ ${warningThreshold}%）`;
            thresholdInfo = `<span class="threshold-detail">当前风险水平接近预警阈值，请注意监控</span>`;
        } else if (cvPercent >= warningThreshold * 0.5) {
            statusClass = 'safe';
            statusText = `风险状态：安全（CV=${cvPercent.toFixed(2)}% < ${warningThreshold}%）`;
            thresholdInfo = `<span class="threshold-detail">当前风险水平在安全范围内</span>`;
        } else {
            statusClass = 'safe';
            statusText = `风险状态：非常安全（CV=${cvPercent.toFixed(2)}% < ${warningThreshold * 0.5}%）`;
            thresholdInfo = `<span class="threshold-detail">风险水平极低，业务稳定性良好</span>`;
        }
        
        console.log('最终状态:', statusClass, statusText);
        
        statusElement.innerHTML = `
            <span class="status-indicator ${statusClass}">${statusText}</span>
            ${thresholdInfo}
        `;
    }
    
    // 独立的阈值状态更新方法，用于立即响应阈值调整
    updateRiskStatusIndicator() {
        const warningThreshold = parseFloat(document.getElementById('warningThreshold').value);
        const riskThreshold = parseFloat(document.getElementById('riskThreshold').value);
        
        console.log('阈值更新:', { warningThreshold, riskThreshold });
        
        // 验证阈值合理性
        if (warningThreshold >= riskThreshold) {
            this.showNotification('预警阈值应小于风险阈值！', 'warning');
            // 即使阈值不合理，也强制更新状态显示
            const statusElement = document.getElementById('thresholdStatus');
            statusElement.innerHTML = `
                <span class="status-indicator danger">风险状态：阈值设置错误</span>
                <span class="threshold-detail">预警阈值不能大于等于风险阈值</span>
            `;
            return;
        }
        
        // 获取当前CV值（如果已计算过）
        const cvElement = document.getElementById('cvResult');
        if (cvElement && cvElement.textContent !== '-') {
            const cvText = cvElement.textContent.replace(' %', '');
            const cvPercent = parseFloat(cvText);
            if (!isNaN(cvPercent)) {
                this.updateRiskStatus(cvPercent / 100);
            } else {
                // 如果CV值无效，显示等待计算状态
                const statusElement = document.getElementById('thresholdStatus');
                statusElement.innerHTML = `
                    <span class="status-indicator safe">风险状态：等待计算</span>
                    <span class="threshold-detail">请先进行计算或开启实时计算</span>
                `;
            }
        } else {
            // 如果没有计算过CV值，显示初始状态
            const statusElement = document.getElementById('thresholdStatus');
            statusElement.innerHTML = `
                <span class="status-indicator safe">风险状态：待计算</span>
                <span class="threshold-detail">当前阈值：预警 ${warningThreshold}%，风险 ${riskThreshold}%</span>
            `;
        }
        
        // 显示阈值更新提示
        this.showThresholdInfo();
    }
    
    // 显示阈值信息
    showThresholdInfo() {
        const warningThreshold = parseFloat(document.getElementById('warningThreshold').value);
        const riskThreshold = parseFloat(document.getElementById('riskThreshold').value);
        
        console.log(`阈值已更新：预警=${warningThreshold}%，风险=${riskThreshold}%`);
        
        // 可以添加阈值变化的视觉反馈
        const thresholdElements = document.querySelectorAll('.threshold-group input');
        thresholdElements.forEach(input => {
            input.style.borderColor = '#4CAF50';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 1000);
        });
    }

    updateAnalysisSummary(mean, variance, stdDev, cv) {
        const summaryElement = document.getElementById('summaryResults');
        const riskLevel = cv < 0.1 ? '低风险' : cv < 0.2 ? '中等风险' : cv < 0.3 ? '较高风险' : '高风险';
        const cvPercent = cv * 100;
        const warningThreshold = parseFloat(document.getElementById('warningThreshold').value);
        const riskThreshold = parseFloat(document.getElementById('riskThreshold').value);
        
        let thresholdInfo = '';
        if (cvPercent >= riskThreshold) {
            thresholdInfo = '<p style="color: #e53e3e; font-weight: bold;">⚠️ 风险已超过设定阈值，建议调整参数或加强风险管理</p>';
        } else if (cvPercent >= warningThreshold) {
            thresholdInfo = '<p style="color: #ed8936; font-weight: bold;">⚠️ 风险接近预警阈值，请密切关注</p>';
        }
        
        summaryElement.innerHTML = `
            <p><strong>当前风险特征：${riskLevel}</strong></p>
            ${thresholdInfo}
            <ul>
                <li>预期理赔总额：${this.formatNumber(mean)} 元</li>
                <li>风险波动（标准差）：${this.formatNumber(stdDev)} 元</li>
                <li>相对风险水平（变异系数）：${cvPercent.toFixed(2)}%</li>
                <li>95%置信区间：[${this.formatNumber(mean - 1.96 * stdDev)}, ${this.formatNumber(mean + 1.96 * stdDev)}] 元</li>
                <li>风险准备金建议：${this.formatNumber(mean + 2 * stdDev)} 元</li>
            </ul>
            <p><em>${this.getRiskAdvice(cv)}</em></p>
        `;
    }

    getRiskAdvice(cv) {
        const cvPercent = cv * 100;
        const warningThreshold = parseFloat(document.getElementById('warningThreshold').value);
        const riskThreshold = parseFloat(document.getElementById('riskThreshold').value);
        
        if (cvPercent >= riskThreshold) {
            return "风险水平严重超标！建议：1) 降低保单数量 2) 提高保费 3) 增加再保险安排 4) 加强风险对冲";
        } else if (cvPercent >= warningThreshold) {
            return "风险水平较高，建议：1) 监控风险变化 2) 准备应急预案 3) 考虑风险分散策略";
        } else if (cv < 0.1) {
            return "风险水平较低，可考虑：1) 适当降低风险附加费率 2) 扩大业务规模 3) 优化产品设计";
        } else {
            return "风险水平适中，建议保持当前定价策略，定期进行风险评估";
        }
    }

    updateCharts(mean, variance, params) {
        // 更新分布图表
        this.distributionChart.data.datasets[0].data = [mean, variance];
        this.distributionChart.update();

        // 更新概率变化图表
        this.updateProbabilityChart();
        
        // 更新模拟图表
        this.updateSimulationChart(params);
        
        // 更新对比图表
        this.updateComparisonChart(params, mean, variance);
    }

    updateProbabilityChart() {
        // 生成概率变化数据
        const probabilities = [0.001, 0.005, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1];
        const means = [];
        const variances = [];
        
        probabilities.forEach(q => {
            const tempParams = { ...this.getInputValues(), damageProbability: q };
            means.push(this.calculateMean(tempParams));
            variances.push(this.calculateVariance(tempParams));
        });

        this.probabilityChart.data.labels = probabilities.map(q => q.toFixed(3));
        this.probabilityChart.data.datasets[0].data = means;
        this.probabilityChart.data.datasets[1].data = variances;
        this.probabilityChart.update();
    }

    updateSimulationChart(params) {
        const simulationResults = this.simulateClaimsDistribution(params);
        const histogram = this.createHistogram(simulationResults, 20);
        
        this.simulationChart.data.labels = histogram.labels;
        this.simulationChart.data.datasets[0].data = histogram.values;
        this.simulationChart.update();
    }

    updateComparisonChart(params, currentMean, currentVariance) {
        // 计算三种损毁类型的结果
        const fullParams = { ...params, damageType: 'full' };
        const partialParams = { ...params, damageType: 'partial', partialRatio: 0.3 };
        const mixedParams = { 
            ...params, 
            damageType: 'mixed', 
            fullDamageProb: params.damageProbability * 0.5,
            partialDamageProb: params.damageProbability * 0.5,
            mixedPartialRatio: 0.3
        };

        const fullMean = this.calculateMean(fullParams);
        const fullVariance = this.calculateVariance(fullParams);
        const partialMean = this.calculateMean(partialParams);
        const partialVariance = this.calculateVariance(partialParams);
        const mixedMean = this.calculateMean(mixedParams);
        const mixedVariance = this.calculateVariance(mixedParams);

        this.comparisonChart.data.datasets[0].data = [fullMean, partialMean, mixedMean];
        this.comparisonChart.data.datasets[1].data = [fullVariance, partialVariance, mixedVariance];
        this.comparisonChart.update();
    }

    simulateClaimsDistribution(params) {
        const { policyCount, claimAmount, damageProbability, damageType } = params;
        const simulations = 10000;
        const results = [];
        
        for (let i = 0; i < simulations; i++) {
            let totalClaims = 0;
            for (let j = 0; j < policyCount; j++) {
                if (Math.random() < damageProbability) {
                    if (damageType === 'full') {
                        totalClaims += claimAmount;
                    } else if (damageType === 'partial') {
                        totalClaims += claimAmount * params.partialRatio;
                    } else {
                        // 混合损毁模拟
                        const rand = Math.random();
                        if (rand < params.fullDamageProb / damageProbability) {
                            totalClaims += claimAmount;
                        } else {
                            totalClaims += claimAmount * params.mixedPartialRatio;
                        }
                    }
                }
            }
            results.push(totalClaims);
        }
        
        return results;
    }

    createHistogram(data, bins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / bins;
        
        const histogram = Array(bins).fill(0);
        const labels = [];
        
        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = binStart + binWidth;
            labels.push(`${(binStart/1000).toFixed(0)}k-${(binEnd/1000).toFixed(0)}k`);
            
            histogram[i] = data.filter(x => x >= binStart && x < binEnd).length;
        }
        
        return { labels, values: histogram };
    }

    updateProbabilityChartData() {
        // 实时更新概率滑块显示
        const slider = document.getElementById('damageProbability');
        const valueDisplay = document.getElementById('damageProbabilityValue');
        if (slider && valueDisplay) {
            const value = parseFloat(slider.value);
            valueDisplay.textContent = value.toFixed(3);
            const percentElement = document.querySelector('.range-percent');
            if (percentElement) {
                percentElement.textContent = `(${(value * 100).toFixed(1)}%)`;
            }
        }
    }

    formatNumber(num) {
        if (num === 0) return '0';
        if (Math.abs(num) < 0.001) return num.toExponential(3);
        if (Math.abs(num) >= 1000) return num.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
        return num.toLocaleString('zh-CN', { maximumFractionDigits: 4 });
    }

    animateResults() {
        const resultCards = document.querySelectorAll('.result-card');
        resultCards.forEach((card, index) => {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'fadeIn 0.6s ease-out';
            }, index * 100);
        });
    }

    // 本地存储功能
    saveSettings() {
        const settings = {
            currentScenario: this.currentScenario,
            scenarios: this.scenarios,
            realTimeMode: this.realTimeMode,
            riskThreshold: document.getElementById('riskThreshold').value,
            warningThreshold: document.getElementById('warningThreshold').value
        };
        localStorage.setItem('riskModelSettings', JSON.stringify(settings));
    }

    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('riskModelSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.currentScenario = settings.currentScenario || 'custom';
                this.scenarios = { ...this.scenarios, ...settings.scenarios };
                this.realTimeMode = settings.realTimeMode || false;
                
                // 恢复阈值设置
                if (settings.riskThreshold) {
                    document.getElementById('riskThreshold').value = settings.riskThreshold;
                }
                if (settings.warningThreshold) {
                    document.getElementById('warningThreshold').value = settings.warningThreshold;
                }
                
                // 恢复情景选择
                this.selectScenario(this.currentScenario);
                
                // 恢复实时计算状态
                this.updateRealTimeButton();
            }
        } catch (error) {
            console.warn('加载保存的设置失败:', error);
        }
    }

    resetParameters() {
        if (confirm('确定要重置所有参数到默认值吗？')) {
            // 重置输入值
            document.getElementById('policyCount').value = 100;
            document.getElementById('claimAmount').value = 100000;
            document.getElementById('damageProbability').value = 0.01;
            document.getElementById('damageType').value = 'full';
            document.getElementById('partialRatio').value = 0.3;
            document.getElementById('fullDamageProb').value = 0.005;
            document.getElementById('partialDamageProb').value = 0.005;
            document.getElementById('mixedPartialRatio').value = 0.3;
            document.getElementById('riskThreshold').value = 30;
            document.getElementById('warningThreshold').value = 15;
            
            // 触发损毁类型变化
            document.getElementById('damageType').dispatchEvent(new Event('change'));
            
            // 更新显示
            this.updateProbabilityChartData();
            this.selectScenario('custom');
            
            if (this.realTimeMode) this.calculate();
            
            this.showNotification('参数已重置', 'success');
        }
    }

    exportReport() {
        const params = this.getInputValues();
        const mean = this.calculateMean(params);
        const variance = this.calculateVariance(params);
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean;
        
        const report = {
            title: '个体风险模型分析报告',
            timestamp: new Date().toLocaleString('zh-CN'),
            parameters: params,
            results: {
                mean: mean,
                variance: variance,
                stdDev: stdDev,
                cv: cv
            },
            riskAssessment: this.getRiskAdvice(cv)
        };
        
        // 创建下载链接
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `风险分析报告_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode);
        
        this.showNotification('报告导出成功', 'success');
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const colors = {
            success: '#48bb78',
            warning: '#ed8936',
            error: '#f56565',
            info: '#4299e1'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 添加CSS动画
    addNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 全局变量用于保存模型实例
window.riskModel = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.riskModel = new IndividualRiskModel();
    window.riskModel.addNotificationStyles();
    
    // 初始计算一次
    setTimeout(() => {
        document.getElementById('calculateBtn').click();
    }, 500);
});

// 添加键盘快捷键支持
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('calculateBtn').click();
    }
});

// 添加输入实时验证
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        const value = parseFloat(this.value);
        const min = parseFloat(this.min) || 0;
        const max = parseFloat(this.max) || Infinity;
        
        if (value < min) this.value = min;
        if (value > max) this.value = max;
    });
});

// 添加页面卸载前保存设置
window.addEventListener('beforeunload', () => {
    const model = window.riskModel;
    if (model) {
        model.saveSettings();
    }
});