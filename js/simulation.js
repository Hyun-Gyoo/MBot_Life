// --- Simulation Engine ---

// Pure simulation function that takes a state and returns results and metrics
function simulateScenario(state) {
    const YR = state.simulationPeriod;
    const initialAsset = state.initialInvestment;
    const annualRate = state.annualRate;
    const startYM = state.startDate;
    const birthYM = state.birthDate;
    const currentDate = state.currentDate;
    const targetCurrentBalance = state.currentBalance !== undefined ? state.currentBalance : initialAsset;
    
    const monthlyCompoundingRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    
    let monthlyDetails = [];
    let currentBalance = initialAsset;
    
    const totalMonths = YR * 12;
    
    // Map balance history by date
    const balanceHistoryMap = {};
    if (state.balanceHistory && state.balanceHistory.length > 0) {
        state.balanceHistory.forEach(bh => {
            if (bh.date && bh.amount !== undefined) {
                balanceHistoryMap[bh.date] = Number(bh.amount);
            }
        });
    }
    
    for (let m = 0; m < totalMonths; m++) {
        const currentYM = addMonths(startYM, m);
        const [yearStr, monthStr] = currentYM.split('-');
        const currentYear = Number(yearStr);
        const currentMonth = Number(monthStr);
        
        // If currentYM matches currentDate, resync asset balance to targetCurrentBalance
        if (currentDate && currentYM === currentDate) {
            currentBalance = targetCurrentBalance;
        }
        // If currentYM matches a balance history entry, resync asset balance to recorded snapshot
        if (balanceHistoryMap[currentYM] !== undefined) {
            currentBalance = balanceHistoryMap[currentYM];
        }
        
        // Calculate age
        const [bYear, bMonth] = birthYM.split('-').map(Number);
        const ageYears = currentYear - bYear;
        const ageMonths = currentMonth - bMonth;
        const exactAge = ageYears + ageMonths / 12;
        
        const startingBalance = currentBalance;
        
        let regMonthlyIncome = 0;
        let regAnnualIncome = 0;
        let loanInflow = 0;
        let onetimeInflow = 0;
        
        const inflationFactor = Math.pow(1 + state.inflationRate / 100, m / 12);
        
        // 1. Regular Monthly Income (grows with inflation ONLY if applyInflation is true, else flat)
        state.monthlyIncome.forEach(item => {
            if (currentYM >= item.start && currentYM <= item.end) {
                const applyInf = item.applyInflation !== false; // default true for backward compatibility
                const infFactor = applyInf ? inflationFactor : 1;
                
                let incFactor = 1;
                if (item.increaseRate) {
                    const monthsSinceStart = diffMonths(item.start, currentYM);
                    if (monthsSinceStart > 0) {
                        incFactor = Math.pow(1 + item.increaseRate / 100, monthsSinceStart / 12);
                    }
                }
                
                regMonthlyIncome += item.amount * infFactor * incFactor;
            }
        });
        
        // 2. Regular Annual Income (Apply in December, grows with inflation ONLY if applyInflation is true)
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
                    
                    regAnnualIncome += item.amount * infFactor * incFactor;
                }
            });
        }
        
        // 3. Loans Borrow/Lend Inflow (grows with inflation ONLY if applyInflation is checked)
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            
            if (currentYM === loan.borrowDate) {
                if (!isLend) {
                    loanInflow += loan.amount * factor; // 대출: 발생 시 자금 유입
                }
            }
            if (currentYM === loan.repayDate) {
                if (isLend) {
                    loanInflow += loan.amount * factor; // 대여: 만기 시 원금 회수(유입)
                }
            }
        });
        
        // 4. One-time Flows (Inflow portion, grows with inflation ONLY if applyInflation is checked)
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount > 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                onetimeInflow += flow.amount * factor;
            }
        });
        
        // Outflows
        let regMonthlyExpense = 0;
        let loanInterest = 0;
        let loanRepayment = 0;
        let onetimeOutflow = 0;
        
        // 1. Regular Monthly Expenditure (grows with inflation ONLY if applyInflation is true)
        state.monthlyExpense.forEach(item => {
            if (currentYM >= item.start && currentYM <= item.end) {
                const applyInf = item.applyInflation !== false;
                const factor = applyInf ? inflationFactor : 1;
                regMonthlyExpense += item.amount * factor;
            }
        });
        
        // 2. Loan & Lend Interest and Repayment/Lend Outflow
        state.loans.forEach(loan => {
            const factor = loan.applyInflation ? inflationFactor : 1;
            const isLend = loan.type === 'lend';
            const principal = loan.amount * factor;
            const isDeferred = !!loan.isDeferredInterest;
            const deferredType = loan.deferredInterestType || 'simple';
            
            if (isDeferred) {
                // 후지급 방식: 매월 현금 흐름 발생 안 함, 만기월(repayDate)에 총 이자 일시 반영
                if (currentYM === loan.repayDate) {
                    const durationMonths = Math.max(0, diffMonths(loan.borrowDate, loan.repayDate));
                    if (durationMonths > 0) {
                        const monthlyRate = (loan.rate / 100) / 12;
                        let totalInterest = 0;
                        if (deferredType === 'compound') {
                            totalInterest = principal * (Math.pow(1 + monthlyRate, durationMonths) - 1);
                        } else {
                            totalInterest = principal * monthlyRate * durationMonths;
                        }
                        
                        if (isLend) {
                            loanInterest -= totalInterest; // 대여 이자 후지급 수입
                        } else {
                            loanInterest += totalInterest; // 대출 이자 후지급 지출
                        }
                    }
                }
            } else {
                // 기존 매월 지급 방식
                if (currentYM > loan.borrowDate && currentYM <= loan.repayDate) {
                    const interestAmount = principal * (loan.rate / 100) / 12;
                    if (isLend) {
                        loanInterest -= interestAmount; // 대여 이자: 유입이므로 이자지출에서 차감 (음수 지출)
                    } else {
                        loanInterest += interestAmount; // 대출 이자: 지출로 가산
                    }
                }
            }
            
            // Repayment / Lend Outflow condition
            if (currentYM === loan.borrowDate) {
                if (isLend) {
                    loanRepayment += principal; // 대여: 발생 시점에 자금 대여(지출로 가산)
                }
            }
            if (currentYM === loan.repayDate) {
                if (!isLend) {
                    loanRepayment += principal; // 대출: 만기 시점에 상환(지출로 가산)
                }
            }
        });
        
        // 3. One-time Flows (Outflow portion, represented as positive outflow here, grows with inflation ONLY if applyInflation is checked)
        state.onetimeFlow.forEach(flow => {
            if (currentYM === flow.date && flow.amount < 0) {
                const factor = flow.applyInflation ? inflationFactor : 1;
                onetimeOutflow += Math.abs(flow.amount) * factor;
            }
        });
        
        const totalInflow = regMonthlyIncome + regAnnualIncome + loanInflow + onetimeInflow;
        const totalOutflow = regMonthlyExpense + loanInterest + loanRepayment + onetimeOutflow;
        const netCashFlow = totalInflow - totalOutflow;
        const investmentReturn = startingBalance * monthlyCompoundingRate;
        currentBalance = startingBalance + investmentReturn + netCashFlow;
        
        const discountFactor = state.useRealValue ? inflationFactor : 1;
        
        monthlyDetails.push({
            monthIndex: m,
            ym: currentYM,
            year: currentYear,
            month: currentMonth,
            age: exactAge,
            startingBalance: startingBalance / discountFactor,
            regMonthlyIncome: regMonthlyIncome / discountFactor,
            regAnnualIncome: regAnnualIncome / discountFactor,
            loanInflow: loanInflow / discountFactor,
            onetimeInflow: onetimeInflow / discountFactor,
            regMonthlyExpense: regMonthlyExpense / discountFactor,
            loanInterest: loanInterest / discountFactor,
            loanRepayment: loanRepayment / discountFactor,
            onetimeOutflow: onetimeOutflow / discountFactor,
            totalInflow: totalInflow / discountFactor,
            totalOutflow: totalOutflow / discountFactor,
            netCashFlow: netCashFlow / discountFactor,
            investmentReturn: investmentReturn / discountFactor,
            endingBalance: currentBalance / discountFactor
        });
    }
    
    // Aggregate to Annual Results
    let annualMap = {};
    monthlyDetails.forEach(mDetail => {
        const yr = mDetail.year;
        if (!annualMap[yr]) {
            annualMap[yr] = {
                year: yr,
                endAge: 0,
                startingBalance: mDetail.startingBalance,
                endingBalance: 0,
                regMonthlyIncome: 0,
                regAnnualIncome: 0,
                loanInflow: 0,
                onetimeInflow: 0,
                regMonthlyExpense: 0,
                loanInterest: 0,
                loanRepayment: 0,
                onetimeOutflow: 0,
                totalInflow: 0,
                totalOutflow: 0,
                netCashFlow: 0,
                investmentReturn: 0,
                monthsCount: 0
            };
        }
        
        const yrData = annualMap[yr];
        yrData.endAge = Math.floor(mDetail.age);
        yrData.regMonthlyIncome += mDetail.regMonthlyIncome;
        yrData.regAnnualIncome += mDetail.regAnnualIncome;
        yrData.loanInflow += mDetail.loanInflow;
        yrData.onetimeInflow += mDetail.onetimeInflow;
        yrData.regMonthlyExpense += mDetail.regMonthlyExpense;
        yrData.loanInterest += mDetail.loanInterest;
        yrData.loanRepayment += mDetail.loanRepayment;
        yrData.onetimeOutflow += mDetail.onetimeOutflow;
        yrData.totalInflow += mDetail.totalInflow;
        yrData.totalOutflow += mDetail.totalOutflow;
        yrData.netCashFlow += mDetail.netCashFlow;
        yrData.investmentReturn += mDetail.investmentReturn;
        yrData.endingBalance = mDetail.endingBalance;
        yrData.monthsCount++;
    });
    
    const annualResults = Object.values(annualMap);
    for (let i = 0; i < annualResults.length; i++) {
        if (i === 0) {
            annualResults[i].startingBalance = monthlyDetails[0].startingBalance;
        } else {
            annualResults[i].startingBalance = annualResults[i-1].endingBalance;
        }
    }
    
    // Calculate summary metrics
    const lastYear = annualResults[annualResults.length - 1];
    const endingAssets = lastYear.endingBalance;
    
    let peakAssets = 0;
    let peakYear = 0;
    let peakAge = 0;
    annualResults.forEach(yr => {
        if (yr.endingBalance > peakAssets) {
            peakAssets = yr.endingBalance;
            peakYear = yr.year;
            peakAge = yr.endAge;
        }
    });
    
    let totalReturnSum = 0;
    annualResults.forEach(yr => {
        totalReturnSum += yr.investmentReturn;
    });
    
    let totalNetSavings = 0;
    annualResults.forEach(yr => {
        totalNetSavings += yr.netCashFlow;
    });
    
    return {
        annualResults,
        metrics: {
            endingAssets,
            peakAssets,
            peakYear,
            peakAge,
            totalReturnSum,
            totalNetSavings
        }
    };
}

function runSimulation() {
    syncInputsToState();
    
    const sim = simulateScenario(currentState);
    simulationResults = sim.annualResults;
    
    updateSummaryMetrics(sim.metrics);
    renderTable();
    renderActiveCashflowChart();
    
    // Render the active scenario's asset projection line chart in editor view
    renderComparisonChart([{
        name: activeScenarioName || "현재 시나리오",
        results: simulationResults,
        metrics: sim.metrics,
        state: currentState
    }]);
    
    // Auto-save edited state to localStorage in real-time
    if (activeScenarioName) {
        let presets = JSON.parse(localStorage.getItem('mbot_life_presets') || '{}');
        presets[activeScenarioName] = JSON.parse(JSON.stringify(currentState));
        localStorage.setItem('mbot_life_presets', JSON.stringify(presets));
    }
}
