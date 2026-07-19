// --- Excel/CSV Data Exporter ---

function exportToCSV() {
    if (simulationResults.length === 0) return;
    
    let csvContent = "\ufeff"; // UTF-8 BOM for Excel compatibility in Korean
    csvContent += "발생일(년월),구분,항목명,금액(원),평가자산(원)\n";
    
    const state = currentState;
    const YR = state.simulationPeriod;
    const initialAsset = state.initialInvestment;
    const annualRate = state.annualRate;
    const startYM = state.startDate;
    
    const monthlyCompoundingRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    
    let currentBalance = initialAsset;
    const totalMonths = YR * 12;
    
    // 1. Initial Investment
    csvContent += `${startYM},초기 자본,투자원금,"${Math.round(initialAsset)}","${Math.round(currentBalance)}"\n`;
    
    for (let m = 0; m < totalMonths; m++) {
        const currentYM = addMonths(startYM, m);
        const [yearStr, monthStr] = currentYM.split('-');
        const currentYear = Number(yearStr);
        const currentMonth = Number(monthStr);
        
        const startingBalance = currentBalance;
        const inflationFactor = Math.pow(1 + state.inflationRate / 100, m / 12);
        
        // Logs for the month
        let monthlyLogs = [];
        let totalNetCashFlow = 0;
        
        // --- INFLOWS ---
        // 1. Regular Monthly Income
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
                monthlyLogs.push({ type: '수입', name: item.label || '월 정기 수입', amount: amt });
                totalNetCashFlow += amt;
            }
        });
        
        // 2. Regular Annual Income
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
                    monthlyLogs.push({ type: '수입', name: item.label || '연 정기 수입', amount: amt });
                    totalNetCashFlow += amt;
                }
            });
        }
        
        // 3. Loans Borrow/Lend Inflow
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            
            if (currentYM === loan.borrowDate) {
                if (!isLend) {
                    const amt = loan.amount * factor;
                    monthlyLogs.push({ type: '수입(대출)', name: loan.name || '대출금 유입', amount: amt });
                    totalNetCashFlow += amt;
                }
            }
            if (currentYM === loan.repayDate) {
                if (isLend) {
                    const amt = loan.amount * factor;
                    monthlyLogs.push({ type: '수입(회수)', name: loan.name || '대여금 회수', amount: amt });
                    totalNetCashFlow += amt;
                }
            }
        });
        
        // 4. One-time Flows (Inflow)
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount > 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                const amt = flow.amount * factor;
                monthlyLogs.push({ type: '수입(일회성)', name: flow.description || '비정기 수입', amount: amt });
                totalNetCashFlow += amt;
            }
        });
        
        // --- OUTFLOWS ---
        // 1. Regular Monthly Expenditure
        state.monthlyExpense.forEach(item => {
            if (currentYM >= item.start && currentYM <= item.end) {
                const applyInf = item.applyInflation !== false;
                const factor = applyInf ? inflationFactor : 1;
                const amt = item.amount * factor;
                monthlyLogs.push({ type: '지출', name: item.label || '월 정기 지출', amount: -amt });
                totalNetCashFlow -= amt;
            }
        });
        
        // 2. Loan & Lend Interest and Repayment/Lend Outflow
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            const principal = loan.amount * factor;
            
            if (currentYM > loan.borrowDate && currentYM <= loan.repayDate) {
                const interestAmount = principal * (loan.rate / 100) / 12;
                if (isLend) {
                    monthlyLogs.push({ type: '수입(이자)', name: (loan.name || '대여') + ' 이자 수입', amount: interestAmount });
                    totalNetCashFlow += interestAmount;
                } else {
                    monthlyLogs.push({ type: '지출(이자)', name: (loan.name || '대출') + ' 이자 지출', amount: -interestAmount });
                    totalNetCashFlow -= interestAmount;
                }
            }
            
            if (currentYM === loan.borrowDate) {
                if (isLend) {
                    monthlyLogs.push({ type: '지출(대여)', name: loan.name || '대여금 유출', amount: -principal });
                    totalNetCashFlow -= principal;
                }
            }
            if (currentYM === loan.repayDate) {
                if (!isLend) {
                    monthlyLogs.push({ type: '지출(상환)', name: loan.name || '대출금 상환', amount: -principal });
                    totalNetCashFlow -= principal;
                }
            }
        });
        
        // 3. One-time Flows (Outflow)
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount < 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                const amt = Math.abs(flow.amount) * factor;
                monthlyLogs.push({ type: '지출(일회성)', name: flow.description || '비정기 지출', amount: -amt });
                totalNetCashFlow -= amt;
            }
        });
        
        // Apply logs sequentially to current balance (though cash flow is cumulative)
        // Let's just output them
        for (let log of monthlyLogs) {
            currentBalance += log.amount;
            csvContent += `${currentYM},${log.type},"${log.name}","${Math.round(log.amount)}","${Math.round(currentBalance)}"\n`;
        }
        
        // Capital Gain (투자 이익)
        const investmentReturn = startingBalance * monthlyCompoundingRate;
        if (investmentReturn > 0 || investmentReturn < 0) {
            currentBalance += investmentReturn;
            csvContent += `${currentYM},자본 이익,월간 투자 수익,"${Math.round(investmentReturn)}","${Math.round(currentBalance)}"\n`;
        }
    }
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `투자_Life_전체로그_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
