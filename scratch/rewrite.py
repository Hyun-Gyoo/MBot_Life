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
                balance: currentBalance,
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
                balance: currentBalance,
                year: currentYear
            });
        }
    }
    
    return allLogs;
}

function exportToCSV() {
    if (simulationResults.length === 0) return;
    
    let csvContent = "\\ufeff"; // UTF-8 BOM
    csvContent += "발생년월,나이,구분,항목명,금액,평가자산\\n";
    
    const logs = generateDetailedLogs(currentState);
    
    // Add initial investment
    csvContent += `${currentState.startDate},${Math.floor(Number(currentState.startDate.split('-')[0]) - Number(currentState.birthDate.split('-')[0]))},초기자본,투자원금,${Math.round(currentState.initialInvestment)},${Math.round(currentState.initialInvestment)}\\n`;
    
    for (const log of logs) {
        csvContent += `${log.date},만 ${log.age}세,${log.type},"${log.name}",${Math.round(log.amount)},${Math.round(log.balance)}\\n`;
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
        
    print("Done writing export.js")

if __name__ == "__main__":
    run()
