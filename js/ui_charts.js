// --- Update Summary Dashboard Metrics ---

function updateSummaryMetrics(metrics) {
    const initialInvestment = currentState.initialInvestment;
    
    // 1. Ending Asset
    const endingAssets = metrics.endingAssets;
    const endingAssetsElem = document.getElementById('metric-ending-assets');
    endingAssetsElem.textContent = formatKRW(endingAssets);
    if (endingAssets < 0) {
        endingAssetsElem.classList.add('trend-negative');
    } else {
        endingAssetsElem.classList.remove('trend-negative');
    }
    
    // Growth Trend
    const growthPercent = ((endingAssets - initialInvestment) / initialInvestment * 100).toFixed(0);
    const endingGrowthElem = document.getElementById('metric-ending-growth');
    endingGrowthElem.textContent = `원금 대비 ${growthPercent >= 0 ? '+' : ''}${growthPercent}%`;
    endingGrowthElem.className = `metric-trend ${growthPercent >= 0 ? 'trend-positive' : 'trend-negative'}`;
    
    // 2. Peak Assets
    document.getElementById('metric-peak-assets').textContent = formatKRW(metrics.peakAssets);
    document.getElementById('metric-peak-age').textContent = `${metrics.peakYear}년 (만 ${metrics.peakAge}세)`;
    
    // 3. Total Investment Return
    const totalReturnElem = document.getElementById('metric-total-returns');
    totalReturnElem.textContent = formatKRW(metrics.totalReturnSum);
    
    const returnShare = endingAssets > 0 ? ((metrics.totalReturnSum / endingAssets) * 100).toFixed(0) : 0;
    document.getElementById('metric-return-share').textContent = `최종 자산의 ${returnShare}% 기여`;
    
    // 4. Net Savings (Cumulative Net Cash Flows)
    const netSavingsElem = document.getElementById('metric-net-savings');
    netSavingsElem.textContent = formatKRW(metrics.totalNetSavings);
    if (metrics.totalNetSavings < 0) {
        netSavingsElem.classList.add('trend-negative');
        document.getElementById('metric-savings-status').textContent = "누적 자본 순 유출";
        document.getElementById('metric-savings-status').className = "metric-trend trend-negative";
    } else {
        netSavingsElem.classList.remove('trend-negative');
        document.getElementById('metric-savings-status').textContent = "누적 자본 순 유입";
        document.getElementById('metric-savings-status').className = "metric-trend trend-positive";
    }
}

// --- Render Table ---

function renderTable() {
    const tbody = document.querySelector('#simulation-table tbody');
    tbody.innerHTML = '';
    
    if (typeof generateDetailedLogs !== 'function') return;
    
    const logs = generateDetailedLogs(currentState);
    
    // Populate year filter
    const yearFilter = document.getElementById('table-year-filter');
    const selectedYear = yearFilter.value;
    
    // Get unique years
    const years = [...new Set(logs.map(log => log.year))];
    
    // Rebuild options if needed
    if (yearFilter.options.length <= 1 || yearFilter.options.length !== years.length + 1) {
        const currentVal = yearFilter.value;
        yearFilter.innerHTML = '<option value="all">전체 연도</option>';
        years.forEach(yr => {
            const opt = document.createElement('option');
            opt.value = yr;
            opt.textContent = `${yr}년`;
            yearFilter.appendChild(opt);
        });
        yearFilter.value = currentVal;
    }
    
    // Filter logs
    let filteredLogs = logs;
    if (selectedYear !== 'all') {
        const targetYear = parseInt(selectedYear, 10);
        filteredLogs = logs.filter(log => log.year === targetYear);
    }
    
    filteredLogs.forEach(log => {
        const row = document.createElement('tr');
        
        let amountClass = 'val-zero';
        if (log.amount > 0) amountClass = 'val-positive';
        else if (log.amount < 0) amountClass = 'val-negative';
        
        let amountRealClass = 'val-zero';
        if (log.amountReal > 0) amountRealClass = 'val-positive';
        else if (log.amountReal < 0) amountRealClass = 'val-negative';
        
        row.innerHTML = `
            <td>${log.date}</td>
            <td>만 ${log.age}세</td>
            <td>${log.type}</td>
            <td>${log.name}</td>
            <td class="${amountRealClass}">${log.amountReal > 0 ? '+' : ''}${formatNumber(log.amountReal)}</td>
            <td class="val-total-assets ${log.balanceReal < 0 ? 'val-negative' : ''}">${formatNumber(log.balanceReal)}</td>
            <td class="${amountClass}">${log.amount > 0 ? '+' : ''}${formatNumber(log.amount)}</td>
            <td class="val-total-assets ${log.balance < 0 ? 'val-negative' : ''}">${formatNumber(log.balance)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// --- Render Charts with ApexCharts ---

// Renders inflow vs outflow bar chart for currently edited scenario
function renderActiveCashflowChart() {
    const totalInflowData = simulationResults.map(yr => Math.round(yr.regMonthlyIncome + yr.regAnnualIncome + yr.loanInflow + yr.onetimeInflow));
    const totalOutflowData = simulationResults.map(yr => Math.round(yr.regMonthlyExpense + yr.loanInterest + yr.loanRepayment + yr.onetimeOutflow));
    
    const cashflowChartOptions = {
        series: [{
            name: '총 유입액',
            data: totalInflowData
        }, {
            name: '총 유출액',
            data: totalOutflowData
        }],
        chart: {
            type: 'bar',
            height: 350,
            foreColor: '#9ca3af',
            background: 'transparent',
            toolbar: { show: false }
        },
        colors: ['#10b981', '#f43f5e'],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: simulationResults.map(yr => `${yr.year}년`),
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return (value / 10000).toFixed(0) + ' 만';
                }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            yaxis: { lines: { show: true } }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right'
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function (value) {
                    return formatKRW(value);
                }
            }
        }
    };

    if (cashflowChart) {
        cashflowChart.updateOptions(cashflowChartOptions);
    } else {
        cashflowChart = new ApexCharts(document.querySelector("#cashflow-chart"), cashflowChartOptions);
        cashflowChart.render();
    }
}

// Renders the main line chart showing comparison of selected asset trajectories
function renderComparisonChart(comparisonData) {
    if (comparisonData.length === 0) {
        if (assetChart) assetChart.updateSeries([]);
        return;
    }
    
    // Find the scenario with the max length to construct categories
    let maxLength = 0;
    let longestResults = [];
    comparisonData.forEach(cd => {
        if (cd.results.length > maxLength) {
            maxLength = cd.results.length;
            longestResults = cd.results;
        }
    });
    
    const yearsLabels = longestResults.map(yr => `${yr.year}년 (만 ${yr.endAge}세)`);
    
    // Construct series data
    const series = comparisonData.map(cd => {
        return {
            name: cd.name,
            data: cd.results.map(yr => Math.round(yr.endingBalance))
        };
    });
    
    // Dynamic chart card title based on inflation settings
    const chartTitle = document.querySelector('.chart-card.large-chart h3');
    if (chartTitle) {
        chartTitle.textContent = currentState.useRealValue 
            ? `평가 자산 추이(현재가치기준, 물가반영 ${currentState.inflationRate}%)`
            : `평가 자산 추이(명목 가치 기준)`;
    }

    const assetChartOptions = {
        series: series,
        chart: {
            type: 'line',
            height: 350,
            foreColor: '#9ca3af',
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        colors: ['#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4'],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        xaxis: {
            categories: yearsLabels,
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return (value / 100000000).toFixed(1) + ' 억';
                }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } }
        },
        tooltip: {
            theme: 'dark',
            x: { show: true },
            y: {
                formatter: function (value) {
                    return formatKRW(value);
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left'
        },
        annotations: {
            xaxis: [
                {
                    x: '2032년 (만 62세)', // Vertical line for expected retirement (based on 2032-06, matching June 2032)
                    borderColor: '#f59e0b',
                    strokeDashArray: 4,
                    label: {
                        borderColor: '#f59e0b',
                        style: {
                            color: '#fff',
                            background: '#f59e0b'
                        },
                        text: '은퇴 예상시점'
                    }
                }
            ]
        }
    };

    if (assetChart) {
        assetChart.updateOptions(assetChartOptions);
    } else {
        assetChart = new ApexCharts(document.querySelector("#assets-chart"), assetChartOptions);
        assetChart.render();
    }
}
