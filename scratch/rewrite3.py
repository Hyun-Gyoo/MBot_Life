import os

def run():
    base_dir = r"c:\Users\jackm\MBot_Life"
    
    # 1. Update export.js
    export_js_path = os.path.join(base_dir, "js", "export.js")
    with open(export_js_path, "w", encoding="utf-8") as f:
        f.write("""// --- Excel/CSV Data Exporter ---

function generateDetailedLogs(state) {
    const YR = state.simulationPeriod;
    const initialAsset = state.initialInvestment;
    const annualRate = state.annualRate;
    const startYM = state.startDate;
    const birthYM = state.birthDate;
    const [bYear, bMonth] = birthYM.split('-').map(Number);
    
    const monthlyCompoundingRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    let currentBalance = initialAsset;
    const totalMonths = YR * 12;
    
    let allLogs = [];
    
    for (let m = 0; m < totalMonths; m++) {
        const currentYM = addMonths(startYM, m);
        const [yearStr, monthStr] = currentYM.split('-');
        const currentYear = Number(yearStr);
        const currentMonth = Number(monthStr);
        
        const ageYears = currentYear - bYear;
        const ageMonths = currentMonth - bMonth;
        const exactAge = Math.floor(ageYears + ageMonths / 12);
        
        const startingBalance = currentBalance;
        const inflationFactor = Math.pow(1 + state.inflationRate / 100, m / 12);
        
        let monthlyLogs = [];
        
        // --- INFLOWS ---
        state.monthlyIncome.forEach(item => {
            if (currentYM >= item.start && currentYM <= item.end) {
                const applyInf = item.applyInflation !== false;
                const infFactor = applyInf ? inflationFactor : 1;
                let incFactor = 1;
                if (item.increaseRate) {
                    const monthsSinceStart = diffMonths(item.start, currentYM);
                    if (monthsSinceStart > 0) {
                        incFactor = Math.pow(1 + item.increaseRate / 100, monthsSinceStart / 12);
                    }
                }
                const amt = item.amount * infFactor * incFactor;
                monthlyLogs.push({ date: currentYM, age: exactAge, type: '정기월수입', name: item.label || '월 정기 수입', amount: amt });
            }
        });
        
        if (currentMonth === 12) {
            state.annualIncome.forEach(item => {
                if (currentYear >= item.startYear && currentYear <= item.endYear) {
                    const applyInf = item.applyInflation !== false;
                    const infFactor = applyInf ? inflationFactor : 1;
                    let incFactor = 1;
                    if (item.increaseRate) {
                        const yearsSinceStart = currentYear - item.startYear;
                        if (yearsSinceStart > 0) {
                            incFactor = Math.pow(1 + item.increaseRate / 100, yearsSinceStart);
                        }
                    }
                    const amt = item.amount * infFactor * incFactor;
                    monthlyLogs.push({ date: currentYM, age: exactAge, type: '정기연수입', name: item.label || '연 정기 수입', amount: amt });
                }
            });
        }
        
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            if (currentYM === loan.borrowDate) {
                if (!isLend) {
                    const amt = loan.amount * factor;
                    monthlyLogs.push({ date: currentYM, age: exactAge, type: '대출/대여', name: loan.name || '대출금 유입', amount: amt });
                }
            }
            if (currentYM === loan.repayDate) {
                if (isLend) {
                    const amt = loan.amount * factor;
                    monthlyLogs.push({ date: currentYM, age: exactAge, type: '대출/대여', name: loan.name || '대여금 회수', amount: amt });
                }
            }
        });
        
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount > 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                const amt = flow.amount * factor;
                monthlyLogs.push({ date: currentYM, age: exactAge, type: '일회성', name: flow.description || '비정기 수입', amount: amt });
            }
        });
        
        // --- OUTFLOWS ---
        state.monthlyExpense.forEach(item => {
            if (currentYM >= item.start && currentYM <= item.end) {
                const applyInf = item.applyInflation !== false;
                const factor = applyInf ? inflationFactor : 1;
                const amt = item.amount * factor;
                monthlyLogs.push({ date: currentYM, age: exactAge, type: '정기월지출', name: item.label || '월 정기 지출', amount: -amt });
            }
        });
        
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            const principal = loan.amount * factor;
            
            if (currentYM > loan.borrowDate && currentYM <= loan.repayDate) {
                const interestAmount = principal * (loan.rate / 100) / 12;
                if (isLend) {
                    monthlyLogs.push({ date: currentYM, age: exactAge, type: '대출/대여', name: (loan.name || '대여') + ' 이자 수입', amount: interestAmount });
                } else {
                    monthlyLogs.push({ date: currentYM, age: exactAge, type: '대출/대여', name: (loan.name || '대출') + ' 이자 지출', amount: -interestAmount });
                }
            }
            
            if (currentYM === loan.borrowDate) {
                if (isLend) {
                    monthlyLogs.push({ date: currentYM, age: exactAge, type: '대출/대여', name: loan.name || '대여금 유출', amount: -principal });
                }
            }
            if (currentYM === loan.repayDate) {
                if (!isLend) {
                    monthlyLogs.push({ date: currentYM, age: exactAge, type: '대출/대여', name: loan.name || '대출금 상환', amount: -principal });
                }
            }
        });
        
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount < 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                const amt = Math.abs(flow.amount) * factor;
                monthlyLogs.push({ date: currentYM, age: exactAge, type: '일회성', name: flow.description || '비정기 지출', amount: -amt });
            }
        });
        
        for (let log of monthlyLogs) {
            currentBalance += log.amount;
            allLogs.push({
                date: log.date,
                age: log.age,
                type: log.type,
                name: log.name,
                amount: log.amount,
                amountReal: log.amount / inflationFactor,
                balance: currentBalance,
                balanceReal: currentBalance / inflationFactor,
                year: currentYear
            });
        }
        
        const investmentReturn = startingBalance * monthlyCompoundingRate;
        if (investmentReturn > 0 || investmentReturn < 0) {
            currentBalance += investmentReturn;
            allLogs.push({
                date: currentYM,
                age: exactAge,
                type: '투자수익',
                name: '월간 투자 수익',
                amount: investmentReturn,
                amountReal: investmentReturn / inflationFactor,
                balance: currentBalance,
                balanceReal: currentBalance / inflationFactor,
                year: currentYear
            });
        }
    }
    
    return allLogs;
}

function exportToCSV() {
    if (simulationResults.length === 0) return;
    
    let csvContent = "\\ufeff"; // UTF-8 BOM
    csvContent += "발생년월,나이,구분,항목명,금액,금액(물가반영),평가자산,평가자산(물가반영)\\n";
    
    const logs = generateDetailedLogs(currentState);
    
    // Add initial investment
    csvContent += `${currentState.startDate},${Math.floor(Number(currentState.startDate.split('-')[0]) - Number(currentState.birthDate.split('-')[0]))},초기자본,투자원금,${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)}\\n`;
    
    for (const log of logs) {
        csvContent += `${log.date},만 ${log.age}세,${log.type},"${log.name}",${Math.round(log.amount)},${Math.round(log.amountReal)},${Math.round(log.balance)},${Math.round(log.balanceReal)}\\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `투자_Life_전체로그_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
""")

    # 2. Update ui_charts.js
    ui_charts_path = os.path.join(base_dir, "js", "ui_charts.js")
    with open(ui_charts_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_render_table = """function renderTable() {
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
            <td class="${amountClass}">${log.amount > 0 ? '+' : ''}${formatNumber(log.amount)}</td>
            <td class="${amountRealClass}">${log.amountReal > 0 ? '+' : ''}${formatNumber(log.amountReal)}</td>
            <td class="val-total-assets ${log.balance < 0 ? 'val-negative' : ''}">${formatNumber(log.balance)}</td>
            <td class="val-total-assets ${log.balanceReal < 0 ? 'val-negative' : ''}">${formatNumber(log.balanceReal)}</td>
        `;
        
        tbody.appendChild(row);
    });
}"""

    import re
    # Replace function renderTable() { ... }
    new_content = re.sub(r'function renderTable\(\) \{.*?\n\}\n', new_render_table + '\n', content, flags=re.DOTALL)
    
    with open(ui_charts_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print("Done writing ui_charts.js")

if __name__ == "__main__":
    run()
