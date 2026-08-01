// --- Scenarios & Initial State ---
const DEFAULT_SCENARIO = {
    initialInvestment: 350000000,
    annualRate: 15,
    inflationRate: 3.2,
    useRealValue: true,
    simulationPeriod: 20,
    birthDate: "1970-06",
    startDate: "2026-07",
    currentDate: "2026-08",
    currentBalance: 350000000,
    
    // 실제 보유 자산 점검 이력
    balanceHistory: [],
    
    // 월 정기 수입
    monthlyIncome: [],
    
    // 연 정기 수입 (년단위 적용)
    annualIncome: [],
    
    // 월 정기 지출
    monthlyExpense: [],
    
    // 대출금 설정 (유입, 이자율, 상환)
    loans: [],
    
    // 일회성 현금 흐름
    onetimeFlow: []
};

let currentState = JSON.parse(JSON.stringify(DEFAULT_SCENARIO));
let simulationResults = [];
let simulationDetailedLogs = [];
let assetChart = null;
let cashflowChart = null;
let activeScenarioName = "";
let landingComparisonChart = null;
