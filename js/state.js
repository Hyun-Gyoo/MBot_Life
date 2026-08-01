// --- Helper to construct the requested sample scenario ---
function getSampleScenario() {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    const startYM = `${curYear}-${curMonth}`;
    const endYM = `${curYear + 20}-${curMonth}`;
    const oneYearLaterYM = `${curYear + 1}-${curMonth}`;
    
    return {
        initialInvestment: 100000000,
        annualRate: 12,
        inflationRate: 3.2,
        useRealValue: true,
        simulationPeriod: 20,
        birthDate: "2000-01",
        startDate: startYM,
        
        balanceHistory: [],
        
        monthlyIncome: [{
            id: "inc-sample-1",
            label: "월 정기 수입",
            amount: 2000000,
            start: startYM,
            end: endYM,
            applyInflation: true
        }],
        
        annualIncome: [],
        
        monthlyExpense: [{
            id: "exp-sample-1",
            label: "월 정기 지출",
            amount: 1500000,
            start: startYM,
            end: endYM,
            applyInflation: true
        }],
        
        loans: [],
        
        onetimeFlow: [{
            id: "ot-sample-1",
            description: "일본 여행",
            amount: -3000000,
            date: oneYearLaterYM,
            applyInflation: true
        }]
    };
}

const DEFAULT_SCENARIO = getSampleScenario();
let currentState = JSON.parse(JSON.stringify(DEFAULT_SCENARIO));
let simulationResults = [];
let simulationDetailedLogs = [];
let assetChart = null;
let cashflowChart = null;
let activeScenarioName = "";
let landingComparisonChart = null;
